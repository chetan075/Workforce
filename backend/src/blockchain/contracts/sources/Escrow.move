module Escrow::InvoiceNFT {
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::timestamp;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_INVOICE_NOT_FOUND: u64 = 2;
    const E_ALREADY_PAID: u64 = 3;
    const E_INSUFFICIENT_PAYMENT: u64 = 4;

    // Invoice status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_APPROVED: u8 = 1;
    const STATUS_PAID: u8 = 2;
    const STATUS_DISPUTED: u8 = 3;

    /// Structure representing an Invoice NFT
    struct InvoiceNFT has store, drop {
        token_id: u64,
        invoice_hash: String,
        client_id: String,
        freelancer_id: String,
        amount: u64,
        currency: String,
        metadata: String,
        ipfs_hash: Option<String>,
        minted_at: u64,
        status: u8,
    }

    /// Trust score entry
    struct TrustEntry has store, drop {
        user_id: String,
        score: u64,
        transaction_count: u64,
        last_updated: u64,
    }

    /// Storage for Invoice NFTs
    struct InvoiceNFTStore has key {
        invoices: vector<InvoiceNFT>,
        next_token_id: u64,
        owner: address,
    }

    /// Storage for Trust Scores
    struct TrustScoreStore has key {
        trust_entries: vector<TrustEntry>,
        owner: address,
    }

    /// Events
    struct InvoiceNFTMintedEvent has drop, store {
        token_id: u64,
        invoice_hash: String,
        client_id: String,
        freelancer_id: String,
        amount: u64,
    }

    struct TrustScoreUpdatedEvent has drop, store {
        user_id: String,
        new_score: u64,
        transaction_count: u64,
    }

    /// Event storage
    struct EventStore has key {
        invoice_events: EventHandle<InvoiceNFTMintedEvent>,
        trust_events: EventHandle<TrustScoreUpdatedEvent>,
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
        };

        if (!exists<TrustScoreStore>(addr)) {
            move_to(account, TrustScoreStore {
                trust_entries: vector::empty<TrustEntry>(),
                owner: addr,
            });
        };

        if (!exists<EventStore>(addr)) {
            move_to(account, EventStore {
                invoice_events: account::new_event_handle<InvoiceNFTMintedEvent>(account),
                trust_events: account::new_event_handle<TrustScoreUpdatedEvent>(account),
            });
        };
    }

    /// Mint a new invoice NFT (simplified version)
    public entry fun mint_invoice_nft_simple(
        account: &signer,
        token_id: u64,
        invoice_hash: String,
        metadata: String,
        client_id: String,
        freelancer_id: String,
    ) acquires InvoiceNFTStore, EventStore {
        let addr = signer::address_of(account);
        
        if (!exists<InvoiceNFTStore>(addr)) {
            initialize(account);
        };

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
            status: STATUS_PENDING,
        };

        vector::push_back(&mut store.invoices, invoice_nft);

        // Emit event
        event::emit_event(&mut event_store.invoice_events, InvoiceNFTMintedEvent {
            token_id,
            invoice_hash,
            client_id,
            freelancer_id,
            amount: 0,
        });
    }

    /// Update invoice status
    public entry fun update_invoice_status(
        account: &signer,
        token_id: u64,
        new_status: u8,
    ) acquires InvoiceNFTStore {
        let addr = signer::address_of(account);
        assert!(exists<InvoiceNFTStore>(addr), E_NOT_AUTHORIZED);
        
        let store = borrow_global_mut<InvoiceNFTStore>(addr);
        let len = vector::length(&store.invoices);
        let i = 0;
        
        while (i < len) {
            let invoice_ref = vector::borrow_mut(&mut store.invoices, i);
            if (invoice_ref.token_id == token_id) {
                invoice_ref.status = new_status;
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
        new_score: u64,
    ) acquires TrustScoreStore, EventStore {
        let addr = signer::address_of(account);
        assert!(exists<TrustScoreStore>(addr), E_NOT_AUTHORIZED);
        
        let store = borrow_global_mut<TrustScoreStore>(addr);
        let event_store = borrow_global_mut<EventStore>(addr);
        
        let len = vector::length(&store.trust_entries);
        let i = 0;
        let found = false;
        
        while (i < len) {
            let entry_ref = vector::borrow_mut(&mut store.trust_entries, i);
            if (entry_ref.user_id == user_id) {
                entry_ref.score = new_score;
                entry_ref.transaction_count = entry_ref.transaction_count + 1;
                entry_ref.last_updated = timestamp::now_seconds();
                found = true;
                break
            };
            i = i + 1;
        };
        
        if (!found) {
            let new_entry = TrustEntry {
                user_id: user_id,
                score: new_score,
                transaction_count: 1,
                last_updated: timestamp::now_seconds(),
            };
            vector::push_back(&mut store.trust_entries, new_entry);
        };

        // Emit event
        event::emit_event(&mut event_store.trust_events, TrustScoreUpdatedEvent {
            user_id,
            new_score,
            transaction_count: if (found) { 
                let entry_ref = vector::borrow(&store.trust_entries, i);
                entry_ref.transaction_count
            } else { 1 },
        });
    }

    /// Get invoice by token ID (view function)
    public fun get_invoice(addr: address, token_id: u64): (bool, u64, String, String, String, u64, String, u64, u8) acquires InvoiceNFTStore {
        if (!exists<InvoiceNFTStore>(addr)) {
            return (false, 0, string::utf8(b""), string::utf8(b""), string::utf8(b""), 0, string::utf8(b""), 0, 0)
        };
        
        let store = borrow_global<InvoiceNFTStore>(addr);
        let len = vector::length(&store.invoices);
        let i = 0;
        
        while (i < len) {
            let invoice_ref = vector::borrow(&store.invoices, i);
            if (invoice_ref.token_id == token_id) {
                return (
                    true,
                    invoice_ref.token_id,
                    invoice_ref.invoice_hash,
                    invoice_ref.client_id,
                    invoice_ref.freelancer_id,
                    invoice_ref.amount,
                    invoice_ref.currency,
                    invoice_ref.minted_at,
                    invoice_ref.status
                )
            };
            i = i + 1;
        };
        
        (false, 0, string::utf8(b""), string::utf8(b""), string::utf8(b""), 0, string::utf8(b""), 0, 0)
    }

    /// Get trust score for a user (view function)
    public fun get_trust_score(addr: address, user_id: String): (bool, u64, u64) acquires TrustScoreStore {
        if (!exists<TrustScoreStore>(addr)) {
            return (false, 0, 0)
        };
        
        let store = borrow_global<TrustScoreStore>(addr);
        let len = vector::length(&store.trust_entries);
        let i = 0;
        
        while (i < len) {
            let entry_ref = vector::borrow(&store.trust_entries, i);
            if (entry_ref.user_id == user_id) {
                return (true, entry_ref.score, entry_ref.transaction_count)
            };
            i = i + 1;
        };
        
        (false, 85, 0) // Default trust score
    }

    /// Get total number of invoices
    public fun get_invoice_count(addr: address): u64 acquires InvoiceNFTStore {
        if (!exists<InvoiceNFTStore>(addr)) {
            return 0
        };
        
        let store = borrow_global<InvoiceNFTStore>(addr);
        vector::length(&store.invoices)
    }
}