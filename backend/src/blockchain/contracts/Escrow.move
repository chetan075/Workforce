module 0x04fa7024f8877de01aa137c92a5ea662e7544d44620fd53bd2b051d150d8c0d0::Escrow {
    use std::signer;
    use std::vector;
    use std::event;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::timestamp;
    use aptos_framework::account;

    // ============================================================================
    // ENHANCED INVOICE NFT SYSTEM FOR CHAINBILL
    // Supports: NFT minting, IPFS storage, trust scores, immutable verification
    // ============================================================================

    /// Error codes
    const E_INVOICE_NOT_FOUND: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_INVALID_TRUST_SCORE: u64 = 3;
    const E_INVOICE_ALREADY_EXISTS: u64 = 4;

    /// Invoice NFT structure with complete metadata
    struct InvoiceNFT has store, drop {
        token_id: u64,
        invoice_hash: vector<u8>,           // SHA256 hash for verification
        client_id: String,                 // Client user ID
        freelancer_id: String,             // Freelancer user ID
        amount: u64,                       // Invoice amount (in smallest unit)
        currency: String,                  // Currency code (USD, EUR, etc.)
        metadata: vector<u8>,              // JSON metadata
        ipfs_hash: Option<String>,         // IPFS file hash (PDF, etc.)
        minted_at: u64,                    // Timestamp
        status: u8,                        // 0=DRAFT, 1=SENT, 2=PAID, 3=RELEASED
    }

    /// Trust score entry for reputation tracking
    struct TrustEntry has store, drop {
        user_id: String,
        score_change: i64,                 // Can be positive or negative
        reason: vector<u8>,                // Reason for score change
        timestamp: u64,
        transaction_hash: vector<u8>,      // For audit trail
    }

    /// User trust score summary
    struct UserTrustScore has store, drop {
        user_id: String,
        total_score: u64,
        total_transactions: u64,
        last_updated: u64,
    }

    /// Main storage for invoice NFTs
    struct InvoiceNFTStore has key {
        invoices: vector<InvoiceNFT>,
        next_token_id: u64,
        owner: address,
    }

    /// Trust score storage
    struct TrustScoreStore has key {
        trust_entries: vector<TrustEntry>,
        user_scores: vector<UserTrustScore>,
        owner: address,
    }

    /// Events for tracking
    struct InvoiceNFTMintedEvent has drop, store {
        token_id: u64,
        invoice_hash: vector<u8>,
        client_id: String,
        freelancer_id: String,
        amount: u64,
        minted_at: u64,
    }

    struct TrustScoreUpdatedEvent has drop, store {
        user_id: String,
        old_score: u64,
        new_score: u64,
        score_change: i64,
        reason: vector<u8>,
    }

    /// Event handles
    struct EventStore has key {
        invoice_events: event::EventHandle<InvoiceNFTMintedEvent>,
        trust_events: event::EventHandle<TrustScoreUpdatedEvent>,
    }

    /// Initialize the module (called once by deployer)
    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        
        if (!exists<InvoiceNFTStore>(addr)) {
            move_to(account, InvoiceNFTStore {
                invoices: vector::empty<InvoiceNFT>(),
                next_token_id: 1,
                owner: addr,
            });
        }

        if (!exists<TrustScoreStore>(addr)) {
            move_to(account, TrustScoreStore {
                trust_entries: vector::empty<TrustEntry>(),
                user_scores: vector::empty<UserTrustScore>(),
                owner: addr,
            });
        }

        if (!exists<EventStore>(addr)) {
            move_to(account, EventStore {
                invoice_events: account::new_event_handle<InvoiceNFTMintedEvent>(account),
                trust_events: account::new_event_handle<TrustScoreUpdatedEvent>(account),
            });
        }
    }

    /// Mint Invoice NFT with complete metadata
    /// This is called when an invoice is marked as PAID
    public entry fun mint_invoice_nft(
        account: &signer,
        token_id: u64,
        invoice_hash: vector<u8>,
        metadata: vector<u8>,
        client_id: String,
        freelancer_id: String,
    ) acquires InvoiceNFTStore, EventStore {
        let addr = signer::address_of(account);
        
        if (!exists<InvoiceNFTStore>(addr)) {
            initialize(account);
        }

        let store = borrow_global_mut<InvoiceNFTStore>(addr);
        let event_store = borrow_global_mut<EventStore>(addr);

        // Create the NFT
        let invoice_nft = InvoiceNFT {
            token_id,
            invoice_hash,
            client_id,
            freelancer_id,
            amount: 0, // Will be updated with actual amount
            currency: string::utf8(b"USD"),
            metadata,
            ipfs_hash: option::none<String>(),
            minted_at: timestamp::now_seconds(),
            status: 2, // PAID status
        };

        vector::push_back(&mut store.invoices, invoice_nft);

        // Emit event
        event::emit_event(&mut event_store.invoice_events, InvoiceNFTMintedEvent {
            token_id,
            invoice_hash,
            client_id,
            freelancer_id,
            amount: 0,
            minted_at: timestamp::now_seconds(),
        });
    }

    /// Update Invoice NFT with IPFS file hash
    public entry fun update_invoice_file(
        account: &signer,
        token_id: u64,
        ipfs_hash: String,
    ) acquires InvoiceNFTStore {
        let addr = signer::address_of(account);
        let store = borrow_global_mut<InvoiceNFTStore>(addr);
        
        let invoices = &mut store.invoices;
        let len = vector::length(invoices);
        let i = 0;
        
        while (i < len) {
            let invoice = vector::borrow_mut(invoices, i);
            if (invoice.token_id == token_id) {
                invoice.ipfs_hash = option::some(ipfs_hash);
                return
            };
            i = i + 1;
        };
        
        abort E_INVOICE_NOT_FOUND
    }

    /// Update trust score for a user
    public entry fun update_trust_score(
        account: &signer,
        user_id: String,
        score_change: i64,
        reason: vector<u8>,
    ) acquires TrustScoreStore, EventStore {
        let addr = signer::address_of(account);
        
        if (!exists<TrustScoreStore>(addr)) {
            initialize(account);
        }

        let trust_store = borrow_global_mut<TrustScoreStore>(addr);
        let event_store = borrow_global_mut<EventStore>(addr);

        // Find or create user score
        let user_scores = &mut trust_store.user_scores;
        let len = vector::length(user_scores);
        let i = 0;
        let found = false;
        let old_score = 0u64;
        let new_score = 0u64;

        while (i < len) {
            let user_score = vector::borrow_mut(user_scores, i);
            if (user_score.user_id == user_id) {
                old_score = user_score.total_score;
                
                // Apply score change (handle negative values)
                if (score_change >= 0) {
                    user_score.total_score = user_score.total_score + (score_change as u64);
                } else {
                    let decrease = ((-score_change) as u64);
                    if (user_score.total_score > decrease) {
                        user_score.total_score = user_score.total_score - decrease;
                    } else {
                        user_score.total_score = 0;
                    }
                };
                
                new_score = user_score.total_score;
                user_score.total_transactions = user_score.total_transactions + 1;
                user_score.last_updated = timestamp::now_seconds();
                found = true;
                break
            };
            i = i + 1;
        };

        // Create new user score if not found
        if (!found) {
            let initial_score = if (score_change >= 0) { (score_change as u64) } else { 0u64 };
            new_score = initial_score;
            
            vector::push_back(user_scores, UserTrustScore {
                user_id,
                total_score: initial_score,
                total_transactions: 1,
                last_updated: timestamp::now_seconds(),
            });
        };

        // Add trust entry for audit trail
        vector::push_back(&mut trust_store.trust_entries, TrustEntry {
            user_id,
            score_change,
            reason,
            timestamp: timestamp::now_seconds(),
            transaction_hash: vector::empty<u8>(), // Will be filled by the system
        });

        // Emit event
        event::emit_event(&mut event_store.trust_events, TrustScoreUpdatedEvent {
            user_id,
            old_score,
            new_score,
            score_change,
            reason,
        });
    }

    /// Get invoice NFT data (view function)
    #[view]
    public fun get_invoice_nft(contract_addr: address, token_id: u64): (vector<u8>, String, String, Option<String>) acquires InvoiceNFTStore {
        let store = borrow_global<InvoiceNFTStore>(contract_addr);
        let invoices = &store.invoices;
        let len = vector::length(invoices);
        let i = 0;
        
        while (i < len) {
            let invoice = vector::borrow(invoices, i);
            if (invoice.token_id == token_id) {
                return (invoice.invoice_hash, invoice.client_id, invoice.freelancer_id, invoice.ipfs_hash)
            };
            i = i + 1;
        };
        
        abort E_INVOICE_NOT_FOUND
    }

    /// Get user trust score (view function)
    #[view]
    public fun get_user_trust_score(contract_addr: address, user_id: String): (u64, u64, u64) acquires TrustScoreStore {
        let store = borrow_global<TrustScoreStore>(contract_addr);
        let user_scores = &store.user_scores;
        let len = vector::length(user_scores);
        let i = 0;
        
        while (i < len) {
            let user_score = vector::borrow(user_scores, i);
            if (user_score.user_id == user_id) {
                return (user_score.total_score, user_score.total_transactions, user_score.last_updated)
            };
            i = i + 1;
        };
        
        // Return default values for new users
        (0, 0, 0)
    }

    /// Verify invoice integrity (view function)
    #[view]
    public fun verify_invoice_hash(contract_addr: address, token_id: u64, provided_hash: vector<u8>): bool acquires InvoiceNFTStore {
        let store = borrow_global<InvoiceNFTStore>(contract_addr);
        let invoices = &store.invoices;
        let len = vector::length(invoices);
        let i = 0;
        
        while (i < len) {
            let invoice = vector::borrow(invoices, i);
            if (invoice.token_id == token_id) {
                return invoice.invoice_hash == provided_hash
            };
            i = i + 1;
        };
        
        false
    }

    /// Legacy compatibility functions
    public entry fun mint_invoice_with_metadata(account: &signer, invoice_id: u64, metadata: vector<u8>) acquires InvoiceNFTStore, EventStore {
        mint_invoice_nft(
            account,
            invoice_id,
            vector::empty<u8>(), // empty hash for backward compatibility
            metadata,
            string::utf8(b""), // empty client_id
            string::utf8(b""), // empty freelancer_id
        );
    }

    public entry fun mint_reputation(account: &signer, score: u64) acquires TrustScoreStore, EventStore {
        update_trust_score(
            account,
            string::utf8(b"legacy_user"), // placeholder user ID
            (score as i64),
            b"Legacy reputation mint",
        );
    }
}
