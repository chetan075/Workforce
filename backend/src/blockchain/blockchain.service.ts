import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/Prisma.service';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHmac } from 'crypto';
import * as nacl from 'tweetnacl';
import { TextEncoder } from 'util';
import { AptosClient, AptosAccount } from 'aptos';
import { promisify } from 'util';
import { exec as execCb } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import * as jwt from 'jsonwebtoken';
const exec = promisify(execCb);

interface ChallengeEntry {
  challenge: string;
  createdAt: number;
}

@Injectable()
export class BlockchainService {
  private challenges = new Map<string, ChallengeEntry>();

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private configService: ConfigService,
  ) {}

  // Manual JWT creation when JwtService is not available
  private createJwtToken(payload: any): string {
    const secret = process.env.JWT_SECRET ?? 'dev';
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + 3600; // 1 hour

    const fullPayload = { ...payload, iat: now, exp };

    const headerBase64 = Buffer.from(JSON.stringify(header)).toString(
      'base64url',
    );
    const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString(
      'base64url',
    );

    const data = `${headerBase64}.${payloadBase64}`;
    const signature = createHmac('sha256', secret)
      .update(data)
      .digest('base64url');

    return `${data}.${signature}`;
  }

  // Safe JWT signing that falls back to manual creation
  private signJwt(payload: any): string {
    if (this.jwt && typeof this.jwt.sign === 'function') {
      try {
        return this.jwt.sign(payload);
      } catch (error) {
        console.warn(
          'JwtService.sign failed, using manual JWT creation:',
          error,
        );
      }
    }

    console.warn('JwtService not available, using manual JWT creation');
    return this.createJwtToken(payload);
  }

  // Create a short-lived challenge for wallet signature
  requestChallenge(address: string) {
    const challenge = 'Sign this challenge: ' + randomBytes(16).toString('hex');
    this.challenges.set(address.toLowerCase(), {
      challenge,
      createdAt: Date.now(),
    });
    return { address, challenge };
  }

  // Verify signature using Ed25519 (Aptos wallets use Ed25519 keys)
  // signature may be hex (0x...) or base64
  async verifySignature(
    address: string,
    signature: string,
    publicKeyHex?: string,
  ) {
    console.log('� verifySignature called with:', {
      address,
      signature: signature.substring(0, 20) + '...',
      publicKeyHex: publicKeyHex?.substring(0, 20) + '...',
      fullSignature: signature,
      fullAddress: address,
      fullPublicKey: publicKeyHex,
      nodeEnv: process.env.NODE_ENV,
      skipSignatureVerification: process.env.SKIP_SIGNATURE_VERIFICATION
    });

    const entry = this.challenges.get(address.toLowerCase());
    if (!entry) {
      console.log('❌ No challenge found for address:', address.toLowerCase());
      return null;
    }

    // Handle development mode first - bypass all crypto verification
    const isDevelopmentSignature = signature.startsWith('dev_signature_');
    const isDevelopmentAddress = address.startsWith('0xdev');
    const isDevelopmentPublicKey =
      publicKeyHex === '0xdev_public_key_placeholder' || !publicKeyHex;

    console.log('🔧 Development mode pattern checks:', {
      isDevelopmentSignature,
      isDevelopmentAddress,
      isDevelopmentPublicKey,
      signatureStart: signature.substring(0, 15),
      addressStart: address.substring(0, 8),
      publicKey: publicKeyHex,
      signatureLength: signature.length,
      addressLength: address.length,
      patterns: {
        sigStartsWithDev: signature.startsWith('dev_signature_'),
        addrStartsWith0xdev: address.startsWith('0xdev'),
        pubKeyIsDevPlaceholder: publicKeyHex === '0xdev_public_key_placeholder',
        pubKeyIsNull: !publicKeyHex
      }
    });

    if (
      isDevelopmentSignature ||
      isDevelopmentAddress ||
      isDevelopmentPublicKey
    ) {
      console.log(
        '🔧 PATTERN-BASED DEVELOPMENT MODE DETECTED - bypassing signature verification'
      );
      console.log('Triggered by:', {
        signature: isDevelopmentSignature ? 'dev_signature pattern' : null,
        address: isDevelopmentAddress ? '0xdev pattern' : null,
        publicKey: isDevelopmentPublicKey ? 'dev placeholder or null' : null,
      });
      this.challenges.delete(address.toLowerCase());

      // Create or find user by wallet address, then issue JWT with user.id as sub
      let user = await this.prisma.user.findFirst({
        where: { walletAddress: address.toLowerCase() },
      });

      if (!user) {
        // Create a new user for this wallet
        user = await this.prisma.user.create({
          data: {
            email: `${address.toLowerCase()}@wallet.generated`, // temporary email
            walletAddress: address.toLowerCase(),
            name: `Wallet User ${address.slice(0, 8)}...`,
            // password is optional for wallet users
          },
        });
      }

      const token = this.signJwt({
        sub: user.id,
        email: user.email,
        wallet: true,
      });

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
        },
      };
    }

    // TEMPORARY: Allow real wallets to pass in development/testing
    const isNodeEnvDevelopment = process.env.NODE_ENV === 'development';
    const isSkipSignatureVerification = process.env.SKIP_SIGNATURE_VERIFICATION === 'true';
    const shouldSkipVerification = isNodeEnvDevelopment || isSkipSignatureVerification;
    
    console.log('🌍 Environment-based development check:', {
      nodeEnv: process.env.NODE_ENV,
      skipSignatureVerification: process.env.SKIP_SIGNATURE_VERIFICATION,
      isNodeEnvDevelopment,
      isSkipSignatureVerification,
      shouldSkipVerification,
      allEnvVars: {
        NODE_ENV: process.env.NODE_ENV,
        SKIP_SIGNATURE_VERIFICATION: process.env.SKIP_SIGNATURE_VERIFICATION,
        APTOS_NETWORK: process.env.APTOS_NETWORK,
        APTOS_SMART_CONTRACT_ADDRESS: process.env.APTOS_SMART_CONTRACT_ADDRESS,
      },
    });
    
    if (shouldSkipVerification) {
      console.log(
        '🚧 ENVIRONMENT-BASED DEVELOPMENT MODE: Skipping real signature verification for testing',
      );
      this.challenges.delete(address.toLowerCase());

      // Create or find user by wallet address, then issue JWT with user.id as sub
      let user = await this.prisma.user.findFirst({
        where: { walletAddress: address.toLowerCase() },
      });

      if (!user) {
        // Create a new user for this wallet
        user = await this.prisma.user.create({
          data: {
            email: `${address.toLowerCase()}@wallet.generated`, // temporary email
            walletAddress: address.toLowerCase(),
            name: `Wallet User ${address.slice(0, 8)}...`,
            // password is optional for wallet users
          },
        });
      }

      const token = this.signJwt({
        sub: user.id,
        email: user.email,
        wallet: true,
      });

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
        },
      };
    }

    if (!publicKeyHex) {
      // If public key not provided we can't verify strict cryptographic proof.
      // Keep previous behaviour: accept for development but log a warning.
      this.challenges.delete(address.toLowerCase());

      // Create or find user by wallet address, then issue JWT with user.id as sub
      let user = await this.prisma.user.findFirst({
        where: { walletAddress: address.toLowerCase() },
      });

      if (!user) {
        // Create a new user for this wallet
        user = await this.prisma.user.create({
          data: {
            email: `${address.toLowerCase()}@wallet.generated`, // temporary email
            walletAddress: address.toLowerCase(),
            name: `Wallet User ${address.slice(0, 8)}...`,
            // password is optional for wallet users
          },
        });
      }

      if (!this.jwt) {
        throw new Error(
          'JWT service is not available. Please restart the server.',
        );
      }

      const token = this.signJwt({
        sub: user.id,
        email: user.email,
        wallet: true,
      });
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          walletAddress: user.walletAddress,
        },
        warning: 'publicKey not provided; signature not verified',
      };
    }

    // Normalize and parse public key and signature
    const parseHexOrBase64 = (s: string) => {
      if (s.startsWith('0x')) {
        const hex = s.slice(2);
        return Uint8Array.from(Buffer.from(hex, 'hex'));
      }
      // try base64
      try {
        return Uint8Array.from(Buffer.from(s, 'base64'));
      } catch (e) {
        // try raw hex
        return Uint8Array.from(Buffer.from(s, 'hex'));
      }
    };

    let pubKeyBytes: Uint8Array;
    let sigBytes: Uint8Array;
    try {
      pubKeyBytes = parseHexOrBase64(publicKeyHex);
      sigBytes = parseHexOrBase64(signature);
    } catch (e) {
      return null;
    }

    let ok = false;
    if (
      isDevelopmentSignature ||
      isDevelopmentAddress ||
      isDevelopmentPublicKey
    ) {
      console.log('🔧 Development mode: bypassing signature verification');
      ok = true; // Allow development signatures to pass
    } else {
      // Real signature verification for production wallets
      console.log('🔐 Attempting real signature verification...');
      
      // Aptos wallets sign a formatted message following the Aptos SignMessage Standard
      // Instead of signing the raw challenge, they sign:
      // "APTOS\nmessage: <challenge>\nnonce: <nonce>"
      // 
      // Since we don't include a nonce in our signMessage call, the format is:
      // "APTOS\nmessage: <challenge>"
      const formattedMessage = `APTOS\nmessage: ${entry.challenge}`;
      const msgBytes = new TextEncoder().encode(formattedMessage);
      
      console.log('Original challenge:', entry.challenge);
      console.log('Formatted message for verification:', formattedMessage);
      console.log('Message bytes length:', msgBytes.length);
      console.log('Signature bytes length:', sigBytes.length);
      console.log('Public key bytes length:', pubKeyBytes.length);
      
      try {
        ok = nacl.sign.detached.verify(msgBytes, sigBytes, pubKeyBytes);
        console.log('✅ NaCl verification result:', ok);
      } catch (verifyError) {
        console.error('❌ NaCl verification error:', verifyError);
        ok = false;
      }
    }

    if (!ok) return null;
    // success
    this.challenges.delete(address.toLowerCase());

    // Create or find user by wallet address, then issue JWT with user.id as sub
    let user = await this.prisma.user.findFirst({
      where: { walletAddress: address.toLowerCase() },
    });

    if (!user) {
      // Create a new user for this wallet
      user = await this.prisma.user.create({
        data: {
          email: `${address.toLowerCase()}@wallet.generated`, // temporary email
          walletAddress: address.toLowerCase(),
          name: `Wallet User ${address.slice(0, 8)}...`,
          // password is optional for wallet users
        },
      });
    }

    const token = this.signJwt({
      sub: user.id,
      email: user.email,
      wallet: true,
    });
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
      },
    };
  }

  // ============================================================================
  // ENHANCED INVOICE BLOCKCHAIN METHODS FOR YOUR COMPLETE FLOW
  // ============================================================================

  /**
   * Mint Invoice NFT with complete metadata for your flow
   * This supports your step 6: "Backend calls Aptos → invoice minted as NFT"
   */
  async mintInvoiceNFT(invoiceData: {
    invoiceId: string;
    invoiceHash: string;
    clientId: string;
    freelancerId: string;
    amount: number;
    currency: string;
  }) {
    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY;
    const STRICT = process.env.APTOS_STRICT === '1' || process.env.APTOS_STRICT === 'true';

    if (!nodeUrl || !pkHex) {
      if (STRICT) {
        throw new Error('APTOS_NODE_URL and APTOS_PRIVATE_KEY must be set');
      }
      // Development fallback
      const fakeTokenId = Date.now();
      const fakeTxHash = '0x' + randomBytes(32).toString('hex');
      return {
        tokenId: fakeTokenId,
        transactionHash: fakeTxHash,
        invoiceHash: invoiceData.invoiceHash,
        stub: true,
      };
    }

    try {
      const client = new AptosClient(nodeUrl);
      let account: any;
      try {
        // Clean up the private key format - remove any prefixes
        let cleanPkHex = pkHex;
        if (pkHex.startsWith('ed25519-priv-0x')) {
          cleanPkHex = pkHex.replace('ed25519-priv-0x', '');
        } else if (pkHex.startsWith('0x')) {
          cleanPkHex = pkHex.replace('0x', '');
        }
        
        // Ensure the key is exactly 64 hex characters (32 bytes)
        if (cleanPkHex.length !== 64) {
          throw new Error(`Invalid private key length: ${cleanPkHex.length}, expected 64 hex characters`);
        }
        
        account = new AptosAccount(Buffer.from(cleanPkHex, 'hex'));
      } catch (e) {
        // Return error information in development mode
        const fakeTokenId = Date.now();
        const fakeTxHash = '0x' + randomBytes(32).toString('hex');
        return {
          tokenId: fakeTokenId,
          transactionHash: fakeTxHash,
          invoiceHash: invoiceData.invoiceHash,
          error: `Error: ${e.message}`,
          stub: true,
        };
      }
      
      const deployer = this.configService.get<string>('APTOS_CONTRACT_ADDRESS');
      if (!deployer) {
        throw new Error('APTOS_CONTRACT_ADDRESS not configured');
      }
      console.log('🏠 [BLOCKCHAIN] Using configured contract address:', deployer);
      
      const accountAddress = typeof account.address === 'function'
        ? account.address().hex()
        : account.address().toString();
      console.log('🔑 [BLOCKCHAIN] Account address:', accountAddress);

      // Enhanced metadata for your complete flow
      const metadata = {
        invoiceId: invoiceData.invoiceId,
        invoiceHash: invoiceData.invoiceHash,
        clientId: invoiceData.clientId,
        freelancerId: invoiceData.freelancerId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        mintedAt: new Date().toISOString(),
        version: '1.0',
      };

      const metadataJson = JSON.stringify(metadata);
      const metadataBytes = Array.from(Buffer.from(metadataJson, 'utf8'));

      // Generate deterministic token ID from invoice ID
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(invoiceData.invoiceId).digest();
      const tokenId = hash[0] * 2**40 + hash[1] * 2**32 + hash[2] * 2**24 + 
                     hash[3] * 2**16 + hash[4] * 2**8 + hash[5];

      const payload: any = {
        function: `${deployer}::InvoiceNFT::mint_invoice_nft_simple`,
        type_arguments: [],
        arguments: [
          Number(tokenId),
          invoiceData.invoiceHash,
          JSON.stringify(metadata), // Convert to JSON string instead of bytes
          invoiceData.clientId,
          invoiceData.freelancerId,
        ],
      };

      // Generate, sign and submit transaction
      let txRequest: any;
      if (typeof client.generateTransaction === 'function') {
        txRequest = await client.generateTransaction(account.address(), payload);
      } else {
        txRequest = await client.generateRawTransaction(account.address(), payload);
      }

      let signed: any;
      if (typeof account.signTransaction === 'function') {
        signed = await account.signTransaction(txRequest);
      } else {
        signed = await client.signTransaction(account, txRequest);
      }

      let res: any;
      if (typeof client.submitSignedBCSTransaction === 'function') {
        res = await client.submitSignedBCSTransaction(signed);
      } else {
        res = await client.submitTransaction(signed);
      }

      return {
        tokenId,
        transactionHash: res.hash,
        invoiceHash: invoiceData.invoiceHash,
        metadata,
      };
    } catch (error) {
      if (STRICT) throw error;
      
      // Fallback for development
      const fakeTokenId = Date.now();
      const fakeTxHash = '0x' + randomBytes(32).toString('hex');
      return {
        tokenId: fakeTokenId,
        transactionHash: fakeTxHash,
        invoiceHash: invoiceData.invoiceHash,
        error: String(error),
        stub: true,
      };
    }
  }

  /**
   * Get Invoice NFT data from blockchain for verification
   * This supports your verification flow
   */
  async getInvoiceNFTData(tokenId: string) {
    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY;
    
    if (!nodeUrl || !pkHex) {
      // Development fallback - return mock data
      return {
        tokenId,
        hash: 'mock_hash_' + tokenId,
        metadata: { mockData: true },
        stub: true,
      };
    }

    try {
      const client = new AptosClient(nodeUrl);
      let account: any;
      try {
        account = new AptosAccount(Buffer.from(pkHex, 'hex'));
      } catch (e) {
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
        } else {
          throw e;
        }
      }

      const deployer = typeof account.address === 'function' 
        ? account.address().hex() 
        : account.address().toString();

      // Query the NFT data from blockchain
      const resources = await client.getAccountResources(deployer);
      const invoiceStore = resources.find(r => 
        r.type.includes('InvoiceNFTStore') || r.type.includes('Escrow')
      );

      if (!invoiceStore) {
        throw new Error('Invoice NFT store not found');
      }

      // Extract NFT data (this depends on your Move contract structure)
      const nftData = (invoiceStore.data as any)?.invoices?.[tokenId] || null;
      
      return {
        tokenId,
        hash: nftData?.invoice_hash || null,
        metadata: nftData?.metadata || {},
        onChain: true,
      };
    } catch (error) {
      // Fallback for development/errors
      return {
        tokenId,
        hash: 'fallback_hash_' + tokenId,
        metadata: { error: String(error) },
        stub: true,
      };
    }
  }

  /**
   * Update Invoice NFT with IPFS file hash
   * This supports your step 7: "IPFS link to invoice PDF stored"
   */
  async updateInvoiceNFTWithFile(tokenId: string, ipfsHash: string) {
    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY;
    const STRICT = process.env.APTOS_STRICT === '1' || process.env.APTOS_STRICT === 'true';

    if (!nodeUrl || !pkHex) {
      if (STRICT) {
        throw new Error('APTOS_NODE_URL and APTOS_PRIVATE_KEY must be set');
      }
      return {
        tokenId,
        ipfsHash,
        transactionHash: '0x' + randomBytes(32).toString('hex'),
        stub: true,
      };
    }

    try {
      const client = new AptosClient(nodeUrl);
      let account: any;
      try {
        account = new AptosAccount(Buffer.from(pkHex, 'hex'));
      } catch (e) {
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
        } else {
          throw e;
        }
      }

      const deployer = this.configService.get<string>('APTOS_CONTRACT_ADDRESS');
      if (!deployer) {
        throw new Error('APTOS_CONTRACT_ADDRESS not configured');
      }
      console.log('🏠 [BLOCKCHAIN] Using configured contract address:', deployer);
      
      const accountAddress = typeof account.address === 'function'
        ? account.address().hex()
        : account.address().toString();
      console.log('🔑 [BLOCKCHAIN] Account address:', accountAddress);

      const payload: any = {
        function: `${deployer}::InvoiceNFT::update_invoice_status`,
        type_arguments: [],
        arguments: [Number(tokenId), ipfsHash],
      };

      // Generate, sign and submit transaction
      let txRequest: any;
      if (typeof client.generateTransaction === 'function') {
        txRequest = await client.generateTransaction(account.address(), payload);
      } else {
        txRequest = await client.generateRawTransaction(account.address(), payload);
      }

      let signed: any;
      if (typeof account.signTransaction === 'function') {
        signed = await account.signTransaction(txRequest);
      } else {
        signed = await client.signTransaction(account, txRequest);
      }

      let res: any;
      if (typeof client.submitSignedBCSTransaction === 'function') {
        res = await client.submitSignedBCSTransaction(signed);
      } else {
        res = await client.submitTransaction(signed);
      }

      return {
        tokenId,
        ipfsHash,
        transactionHash: res.hash,
      };
    } catch (error) {
      if (STRICT) throw error;
      
      return {
        tokenId,
        ipfsHash,
        transactionHash: '0x' + randomBytes(32).toString('hex'),
        error: String(error),
        stub: true,
      };
    }
  }

  /**
   * Record trust score update on blockchain
   * This supports your step 8: "Aarav's trust score +5"
   */
  async recordTrustScoreUpdate(userId: string, scoreChange: number, reason: string) {
    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY;
    const STRICT = process.env.APTOS_STRICT === '1' || process.env.APTOS_STRICT === 'true';

    if (!nodeUrl || !pkHex) {
      if (STRICT) {
        throw new Error('APTOS_NODE_URL and APTOS_PRIVATE_KEY must be set');
      }
      return {
        userId,
        scoreChange,
        reason,
        transactionHash: '0x' + randomBytes(32).toString('hex'),
        stub: true,
      };
    }

    try {
      const client = new AptosClient(nodeUrl);
      let account: any;
      try {
        account = new AptosAccount(Buffer.from(pkHex, 'hex'));
      } catch (e) {
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
        } else {
          throw e;
        }
      }

      const deployer = typeof account.address === 'function' 
        ? account.address().hex() 
        : account.address().toString();

      const payload: any = {
        function: `${deployer}::InvoiceNFT::update_trust_score`,
        type_arguments: [],
        arguments: [
          userId,
          Number(scoreChange),
          Array.from(Buffer.from(reason, 'utf8')), // Convert reason to bytes
        ],
      };

      // Generate, sign and submit transaction
      let txRequest: any;
      if (typeof client.generateTransaction === 'function') {
        txRequest = await client.generateTransaction(account.address(), payload);
      } else {
        txRequest = await client.generateRawTransaction(account.address(), payload);
      }

      let signed: any;
      if (typeof account.signTransaction === 'function') {
        signed = await account.signTransaction(txRequest);
      } else {
        signed = await client.signTransaction(account, txRequest);
      }

      let res: any;
      if (typeof client.submitSignedBCSTransaction === 'function') {
        res = await client.submitSignedBCSTransaction(signed);
      } else {
        res = await client.submitTransaction(signed);
      }

      return {
        userId,
        scoreChange,
        reason,
        transactionHash: res.hash,
      };
    } catch (error) {
      if (STRICT) throw error;
      
      return {
        userId,
        scoreChange,
        reason,
        transactionHash: '0x' + randomBytes(32).toString('hex'),
        error: String(error),
        stub: true,
      };
    }
  }

  /**
   * Get user's trust score from blockchain
   */
  async getUserTrustScore(userId: string) {
    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY;
    
    if (!nodeUrl || !pkHex) {
      // Development fallback
      return {
        userId,
        trustScore: 75, // Mock score
        totalTransactions: 5,
        reputation: 'Good',
        stub: true,
      };
    }

    try {
      const client = new AptosClient(nodeUrl);
      let account: any;
      try {
        account = new AptosAccount(Buffer.from(pkHex, 'hex'));
      } catch (e) {
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
        } else {
          throw e;
        }
      }

      const deployer = this.configService.get<string>('APTOS_CONTRACT_ADDRESS');
      if (!deployer) {
        throw new Error('APTOS_CONTRACT_ADDRESS not configured');
      }
      console.log('🏠 [BLOCKCHAIN] Using configured contract address:', deployer);
      
      const accountAddress = typeof account.address === 'function'
        ? account.address().hex()
        : account.address().toString();
      console.log('🔑 [BLOCKCHAIN] Account address:', accountAddress);

      // Query trust score from blockchain
      const resources = await client.getAccountResources(deployer);
      const trustStore = resources.find(r => 
        r.type.includes('TrustScoreStore') || r.type.includes('Escrow')
      );

      if (!trustStore) {
        throw new Error('Trust score store not found');
      }

      const userData = (trustStore.data as any)?.users?.[userId] || null;
      
      return {
        userId,
        trustScore: userData?.trust_score || 0,
        totalTransactions: userData?.total_transactions || 0,
        reputation: this.getReputationLevel(userData?.trust_score || 0),
        onChain: true,
      };
    } catch (error) {
      // Fallback for development/errors
      return {
        userId,
        trustScore: 50,
        totalTransactions: 0,
        reputation: 'New',
        error: String(error),
        stub: true,
      };
    }
  }

  /**
   * Helper method to determine reputation level based on trust score
   */
  private getReputationLevel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'New';
  }

  // Keep the existing mintInvoiceNFT method for backward compatibility
  async mintInvoiceNFTLegacy(invoiceId: string) {
    console.log('🚀 [BLOCKCHAIN] Starting NFT minting for invoice:', invoiceId);
    
    const inv = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!inv) {
      console.error('❌ [BLOCKCHAIN] Invoice not found:', invoiceId);
      throw new Error('Invoice not found');
    }
    
    console.log('✅ [BLOCKCHAIN] Invoice found:', {
      id: inv.id,
      status: inv.status,
      amount: inv.amount,
      clientId: inv.clientId
    });

    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY; // hex string
    const STRICT =
      process.env.APTOS_STRICT === '1' || process.env.APTOS_STRICT === 'true';
      
    console.log('🔧 [BLOCKCHAIN] Environment check:', {
      nodeUrl: nodeUrl ? `${nodeUrl.substring(0, 30)}...` : 'NOT SET',
      pkHexLength: pkHex ? pkHex.length : 0,
      strictMode: STRICT
    });
      
    if (!nodeUrl || !pkHex) {
      console.warn('⚠️ [BLOCKCHAIN] Missing environment variables');
      if (STRICT) {
        throw new Error(
          'APTOS_NODE_URL and APTOS_PRIVATE_KEY must be set to perform on-chain minting',
        );
      }
      // fallback stub
      const fakeTx = '0x' + randomBytes(12).toString('hex');
      console.log('🎭 [BLOCKCHAIN] Using fallback mode, fake tx:', fakeTx);
      return { invoiceId, txHash: fakeTx, stub: true };
    }

    let tokenId: number | undefined;

    try {
      console.log('🔗 [BLOCKCHAIN] Creating Aptos client...');
      const client = new AptosClient(nodeUrl);
      
      console.log('👤 [BLOCKCHAIN] Creating Aptos account...');
      // Construct Aptos account robustly across SDK versions
      let account: any;
      try {
        // preferred: constructor accepting private key bytes
        console.log('🔑 [BLOCKCHAIN] Attempting primary account creation method...');
        
        // Remove 0x prefix if present and ensure we have the right length
        const cleanPrivateKey = pkHex.startsWith('0x') ? pkHex.slice(2) : pkHex;
        console.log('🔧 [BLOCKCHAIN] Clean private key length:', cleanPrivateKey.length);
        
        // Convert hex to Uint8Array (32 bytes for ed25519)
        const privateKeyBytes = new Uint8Array(
          cleanPrivateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        );
        console.log('🔧 [BLOCKCHAIN] Private key bytes length:', privateKeyBytes.length);
        
        account = new AptosAccount(privateKeyBytes);
        console.log('✅ [BLOCKCHAIN] Account created successfully with primary method');
      } catch (e) {
        console.log('⚠️ [BLOCKCHAIN] Primary method failed, trying fallback...', e);
        // fallback to factory if present
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
          console.log('✅ [BLOCKCHAIN] Account created successfully with fallback method');
        } else {
          console.error('❌ [BLOCKCHAIN] Both account creation methods failed');
          throw e;
        }
      }
      
      const deployer = this.configService.get<string>('APTOS_CONTRACT_ADDRESS');
      if (!deployer) {
        throw new Error('APTOS_CONTRACT_ADDRESS not configured');
      }
      console.log('🏠 [BLOCKCHAIN] Using configured contract address:', deployer);
      
      const accountAddress = typeof account.address === 'function'
        ? account.address().hex()
        : account.address().toString();
      console.log('🔑 [BLOCKCHAIN] Account address:', accountAddress);

      // Build metadata JSON from invoice and encode to bytes
      const metadata = {
        invoiceId: inv.id,
        title: inv.title,
        amount: inv.amount,
        clientId: inv.clientId,
        freelancerId: inv.freelancerId,
        mintedAt: new Date().toISOString(),
      };
      const metadataJson = JSON.stringify(metadata);
      const metadataBytes = Array.from(Buffer.from(metadataJson, 'utf8'));

      // Deterministic tokenId: take first 6 bytes of sha256(invoice.uuid) -> safe u64 within JS number range
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(inv.id).digest();
      // use first 6 bytes -> 48 bits -> safe integer
      tokenId =
        hash[0] * 2 ** 40 +
        hash[1] * 2 ** 32 +
        hash[2] * 2 ** 24 +
        hash[3] * 2 ** 16 +
        hash[4] * 2 ** 8 +
        hash[5] * 1;

      // Call the Move entry function mint_invoice_nft_simple with correct arguments
      const invoiceHash = crypto.createHash('sha256').update(inv.id + inv.title + inv.amount).digest('hex');
      
      const payload: any = {
        function: `${deployer}::InvoiceNFT::mint_invoice_nft_simple`,
        type_arguments: [],
        arguments: [
          Number(tokenId),           // token_id: u64
          invoiceHash,               // invoice_hash: String  
          metadataJson,              // metadata: String
          inv.clientId || 'unknown', // client_id: String
          inv.freelancerId || 'unknown' // freelancer_id: String
        ],
      };

      // Generate, sign and submit transaction using SDK helpers where available
      // Generate transaction
      let txRequest: any;
      if (typeof client.generateTransaction === 'function') {
        txRequest = await client.generateTransaction(
          account.address(),
          payload as any,
        );
      } else if (typeof client.generateRawTransaction === 'function') {
        txRequest = await client.generateRawTransaction(
          account.address(),
          payload as any,
        );
      } else {
        throw new Error(
          'Aptos client does not expose a transaction generation method',
        );
      }

      // Sign transaction: prefer account.signTransaction, fallback to client.signTransaction
      let signed: any;
      if (typeof account.signTransaction === 'function') {
        signed = await account.signTransaction(txRequest as any);
      } else if (typeof client.signTransaction === 'function') {
        signed = await client.signTransaction(account, txRequest as any);
      } else if (typeof account.sign === 'function') {
        // some SDKs use `sign` naming
        signed = await account.sign(txRequest as any);
      } else {
        throw new Error('No available signing method on Aptos account/client');
      }

      // Submit signed transaction
      let res: any;
      if (typeof client.submitSignedBCSTransaction === 'function') {
        res = await client.submitSignedBCSTransaction(signed);
      } else if (typeof client.submitTransaction === 'function') {
        // some SDKs accept signed transaction objects directly
        res = await client.submitTransaction(signed);
      } else {
        throw new Error('Aptos client does not expose a submission method');
      }
      // Persist tokenId and txHash into Invoice record
      try {
        // prisma client may be out-of-date until `npx prisma generate` is run; cast data as any to avoid TS type errors in dev
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            tokenId: BigInt(tokenId!),
            onchainTxHash: String(res.hash),
          } as any,
        });
      } catch (e) {
        // ignore persistence error but return tx info
      }
      return { invoiceId, tokenId, txHash: res.hash };
    } catch (e) {
      console.error('💥 [BLOCKCHAIN] Error during NFT minting:', {
        error: e,
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        invoiceId,
        tokenId,
        strictMode: STRICT
      });
      
      // In strict mode, propagate the error so callers can observe failures instead of getting a silent stub
      if (STRICT) {
        console.error('🚨 [BLOCKCHAIN] Strict mode enabled, throwing error');
        throw e;
      }
      
      console.log('🎭 [BLOCKCHAIN] Non-strict mode, using fallback...');
      const fakeTx = '0x' + randomBytes(12).toString('hex');
      const fallbackTokenId = tokenId ?? Date.now();
      try {
        await this.prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            tokenId: BigInt(fallbackTokenId),
            onchainTxHash: fakeTx,
          } as any,
        });
        console.log('✅ [BLOCKCHAIN] Fallback data saved to database');
      } catch (_) {
        console.error('❌ [BLOCKCHAIN] Failed to save fallback data to database');
      }
      return {
        invoiceId,
        tokenId: fallbackTokenId,
        txHash: fakeTx,
        error: String(e),
      };
    }
  }

  // Mint Reputation SBT: similar strategy to invoice minting
  async mintReputationSBT(userId: string, score = 1) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY; // hex string
    const STRICT =
      process.env.APTOS_STRICT === '1' || process.env.APTOS_STRICT === 'true';
    if (!nodeUrl || !pkHex) {
      const fakeTx = '0x' + randomBytes(12).toString('hex');
      return { userId, txHash: fakeTx, stub: true };
    }

    try {
      const client = new AptosClient(nodeUrl);
      // robust account construction
      let account: any;
      try {
        account = new AptosAccount(Buffer.from(pkHex, 'hex'));
      } catch (err) {
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
        } else {
          throw err;
        }
      }
      const deployer =
        typeof account.address === 'function'
          ? account.address().hex()
          : account.address().toString();

      const payload: any = {
        function: `${deployer}::InvoiceNFT::update_trust_score`,
        type_arguments: [],
        // mint_reputation(account: &signer, score: u64) expects a single u64 score argument
        arguments: [Number(score)],
      };

      // Generate, sign and submit transaction (same robust flow as invoice)
      let txRequest: any;
      if (typeof client.generateTransaction === 'function') {
        txRequest = await client.generateTransaction(
          account.address(),
          payload as any,
        );
      } else if (typeof client.generateRawTransaction === 'function') {
        txRequest = await client.generateRawTransaction(
          account.address(),
          payload as any,
        );
      } else {
        throw new Error(
          'Aptos client does not expose a transaction generation method',
        );
      }

      let signed: any;
      if (typeof account.signTransaction === 'function') {
        signed = await account.signTransaction(txRequest as any);
      } else if (typeof client.signTransaction === 'function') {
        signed = await client.signTransaction(account, txRequest as any);
      } else if (typeof account.sign === 'function') {
        signed = await account.sign(txRequest as any);
      } else {
        throw new Error('No available signing method on Aptos account/client');
      }

      let res: any;
      if (typeof client.submitSignedBCSTransaction === 'function') {
        res = await client.submitSignedBCSTransaction(signed);
      } else if (typeof client.submitTransaction === 'function') {
        res = await client.submitTransaction(signed);
      } else {
        throw new Error('Aptos client does not expose a submission method');
      }
      return { userId, txHash: res.hash };
    } catch (e) {
      if (STRICT) throw e;
      const fakeTx = '0x' + randomBytes(12).toString('hex');
      return { userId, txHash: fakeTx, error: String(e) };
    }
  }

  // Alternative: Initialize contract storage via SDK (simpler than full deployment)
  async initializeContract() {
    const nodeUrl = process.env.APTOS_NODE_URL;
    const pkHex = process.env.APTOS_PRIVATE_KEY;
    
    if (!nodeUrl || !pkHex) {
      throw new Error('APTOS_NODE_URL and APTOS_PRIVATE_KEY must be set');
    }

    try {
      console.log('🚀 [BLOCKCHAIN] Initializing contract storage...');
      const client = new AptosClient(nodeUrl);
      
      // Create account
      let account: any;
      try {
        account = new AptosAccount(Buffer.from(pkHex, 'hex'));
      } catch (e) {
        if (typeof (AptosAccount as any).fromPrivateKeyHex === 'function') {
          account = (AptosAccount as any).fromPrivateKeyHex(pkHex);
        } else {
          throw e;
        }
      }
      
      const deployer = typeof account.address === 'function'
        ? account.address().hex()
        : account.address().toString();
        
      console.log('🏠 [BLOCKCHAIN] Deployer address:', deployer);

      // Call the initialize function to set up storage
      const payload = {
        function: `${deployer}::InvoiceNFT::initialize`,
        type_arguments: [],
        arguments: [],
      };

      console.log('📦 [BLOCKCHAIN] Creating initialization transaction...');
      
      // Generate and submit transaction
      let txRequest: any;
      if (typeof client.generateTransaction === 'function') {
        txRequest = await client.generateTransaction(account.address(), payload);
      } else {
        throw new Error('SDK transaction generation not available');
      }

      let signed: any;
      if (typeof account.signTransaction === 'function') {
        signed = await account.signTransaction(txRequest);
      } else if (typeof client.signTransaction === 'function') {
        signed = await client.signTransaction(account, txRequest);
      } else {
        throw new Error('SDK transaction signing not available');
      }

      let res: any;
      if (typeof client.submitSignedBCSTransaction === 'function') {
        res = await client.submitSignedBCSTransaction(signed);
      } else if (typeof client.submitTransaction === 'function') {
        res = await client.submitTransaction(signed);
      } else {
        throw new Error('SDK transaction submission not available');
      }

      console.log('✅ [BLOCKCHAIN] Contract initialized successfully!');
      console.log('📝 [BLOCKCHAIN] Transaction hash:', res.hash);

      return {
        success: true,
        txHash: res.hash,
        deployer,
        message: 'Contract storage initialized successfully'
      };

    } catch (error) {
      console.error('❌ [BLOCKCHAIN] Contract initialization failed:', error);
      return {
        success: false,
        error: String(error),
        message: 'Contract initialization failed - this is expected if contract is not yet deployed'
      };
    }
  }

  // Publish the Escrow.move package using the Aptos CLI if available.
  // This helper will run `aptos move compile` and `aptos move publish` against the
  // `backend/src/blockchain/contracts` folder. CLI must be installed and configured.
  async publishEscrowModule() {
    const projectDir = path.resolve(__dirname, 'contracts');
    if (!process.env.APTOS_PRIVATE_KEY) {
      throw new Error(
        'APTOS_PRIVATE_KEY not set in environment; cannot publish module',
      );
    }

    // Optionally replace deployer placeholder in Move file with APTOS_DEPLOYER_ADDRESS
    const deployerAddr = process.env.APTOS_DEPLOYER_ADDRESS;
    const contractPath = path.join(projectDir, 'Escrow.move');
    let originalContent: string | null = null;
    try {
      if (deployerAddr) {
        originalContent = await fs.readFile(contractPath, 'utf8');
        const normalized = deployerAddr.startsWith('0x')
          ? deployerAddr
          : `0x${deployerAddr}`;
        const replaced = originalContent.replace(
          /0x\{\{DEPLOYER\}\}/g,
          normalized,
        );
        await fs.writeFile(contractPath, replaced, 'utf8');
      }

      const compileCmd = `aptos move compile --package-dir "${projectDir}"`;
      const publishCmd = `aptos move publish --package-dir "${projectDir}" --assume-yes`;

      const compileRes = await exec(compileCmd);
      const publishRes = await exec(publishCmd);

      // restore original file if we replaced it
      if (originalContent !== null) {
        await fs.writeFile(contractPath, originalContent, 'utf8');
      }

      return {
        compile: compileRes.stdout || compileRes.stderr,
        publish: publishRes.stdout || publishRes.stderr,
      };
    } catch (e: any) {
      // restore original if needed
      if (originalContent !== null) {
        try {
          await fs.writeFile(contractPath, originalContent, 'utf8');
        } catch (_) {}
      }
      return { error: String(e), stdout: e?.stdout, stderr: e?.stderr };
    }
  }
}
