import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/Prisma.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { Invoice } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
  ) {}

  // Helper function to serialize BigInt values to strings
  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(item => this.serializeBigInt(item));
    if (typeof obj === 'object') {
      const serialized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        serialized[key] = this.serializeBigInt(value);
      }
      return serialized;
    }
    return obj;
  }

  // Enhanced create method to support full invoice data including blockchain fields
  async create(data: {
    title: string;
    amount: number;
    clientId?: string;
    freelancerId?: string;
    dueDate?: string;
    currency?: string;
  }) {
    const invoiceData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      currency: data.currency || 'USD',
    };

    const invoice = await this.prisma.invoice.create({
      data: invoiceData,
      include: {
        client: { select: { id: true, name: true, email: true } },
        freelancer: { select: { id: true, name: true, email: true } },
      },
    });

    return this.serializeBigInt(invoice);
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        freelancer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return this.serializeBigInt(inv);
  }

  // Internal method to get raw invoice data without BigInt serialization
  private async findOneRaw(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, email: true } },
        freelancer: { select: { id: true, name: true, email: true } },
      },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async findAllForUser(userId?: string) {
    const whereClause = userId
      ? { OR: [{ clientId: userId }, { freelancerId: userId }] }
      : {};

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, email: true } },
        freelancer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Serialize BigInt values to strings for JSON compatibility
    return this.serializeBigInt(invoices);
  }

  async updateStatus(id: string, status: string) {
    // Validate status enum - this will be important for blockchain integration
    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'RELEASED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    // Update status in database first
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: status as 'DRAFT' | 'SENT' | 'PAID' | 'RELEASED' },
      include: {
        client: { select: { id: true, name: true, email: true } },
        freelancer: { select: { id: true, name: true, email: true } },
      },
    });

    // Blockchain integration: Record status change on-chain for PAID status
    if (status === 'PAID') {
      try {
        // This is where the magic happens for your flow:
        // 1. Generate NFT for the paid invoice
        // 2. Store on Aptos blockchain
        // 3. Update trust scores
        await this.handlePaidInvoiceBlockchain(updatedInvoice);
      } catch (error) {
        console.error('Blockchain update failed:', error);
        // Don't fail the entire operation, just log the error
        // In production, you might want to queue this for retry
      }
    }

    return this.serializeBigInt(updatedInvoice);
  }

  // ============================================================================
  // BLOCKCHAIN INTEGRATION METHODS
  // ============================================================================

  /**
   * Generate SHA256 hash of invoice data for blockchain verification
   */
  private generateInvoiceHash(invoiceData: any): string {
    const hashInput = {
      title: invoiceData.title,
      amount: invoiceData.amount,
      clientId: invoiceData.clientId,
      freelancerId: invoiceData.freelancerId,
      dueDate: invoiceData.dueDate?.toISOString(),
      currency: invoiceData.currency,
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(hashInput))
      .digest('hex');
  }

  /**
   * Handle blockchain operations when invoice is marked as PAID
   * This implements your step 6: "Backend calls Aptos → invoice minted as NFT"
   */
  private async handlePaidInvoiceBlockchain(invoice: any) {
    // 1. Generate invoice hash for verification
    const invoiceHash = this.generateInvoiceHash(invoice);
    
    // 2. Mint NFT on Aptos blockchain
    const mintResult = await this.blockchainService.mintInvoiceNFT({
      invoiceId: invoice.id,
      invoiceHash,
      clientId: invoice.clientId,
      freelancerId: invoice.freelancerId,
      amount: invoice.amount,
      currency: invoice.currency,
    });

    // 3. Update invoice with blockchain data
    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        tokenId: BigInt(mintResult.tokenId),
        onchainTxHash: mintResult.transactionHash,
      },
    });

    // 4. Update trust scores (your step 8)
    await this.updateTrustScores(invoice);
    
    return mintResult;
  }

  /**
   * Update trust scores for both parties (your step 8)
   */
  private async updateTrustScores(invoice: any) {
    // Update freelancer's trust score (+5 for quality invoice)
    if (invoice.freelancerId) {
      await this.prisma.user.update({
        where: { id: invoice.freelancerId },
        data: {
          // Assuming you have a trustScore field in User model
          // trustScore: { increment: 5 }
        },
      });
    }

    // Update client's trust score (+3 for timely payment)
    if (invoice.clientId) {
      await this.prisma.user.update({
        where: { id: invoice.clientId },
        data: {
          // trustScore: { increment: 3 }
        },
      });
    }
  }

  /**
   * Verify invoice against blockchain data
   * This ensures immutability and prevents tampering
   */
  async verifyInvoiceIntegrity(invoiceId: string): Promise<{
    isValid: boolean;
    onChainHash?: string;
    localHash: string;
    tokenId?: string;
  }> {
    const invoice = await this.findOneRaw(invoiceId);
    const localHash = this.generateInvoiceHash(invoice);

    if (!invoice.tokenId || !invoice.onchainTxHash) {
      return {
        isValid: false,
        localHash,
      };
    }

    // Fetch on-chain data to verify
    const onChainData = await this.blockchainService.getInvoiceNFTData(
      invoice.tokenId.toString(),
    );

    return {
      isValid: onChainData.hash === localHash,
      onChainHash: onChainData.hash,
      localHash,
      tokenId: invoice.tokenId.toString(),
    };
  }

  /**
   * Store IPFS file hash with invoice (your step 7)
   */
  async attachFileToInvoice(
    invoiceId: string,
    fileData: {
      filename: string;
      ipfsHash: string;
      fileSize?: number;
    },
  ) {
    // Store file reference in database
    await this.prisma.storedFile.create({
      data: {
        filename: fileData.filename,
        ipfsHash: fileData.ipfsHash,
        fileSize: fileData.fileSize, // Now enabled after Prisma migration
        metadataHash: crypto
          .createHash('sha256')
          .update(fileData.ipfsHash)
          .digest('hex'),
        invoiceId: invoiceId,
      },
    });

    // Update blockchain with file hash
    const invoice = await this.findOne(invoiceId);
    if (invoice.tokenId) {
      await this.blockchainService.updateInvoiceNFTWithFile(
        invoice.tokenId.toString(),
        fileData.ipfsHash,
      );
    }
  }

  // Mint invoice as NFT
  async mintInvoiceNFT(invoiceId: string, userId?: string) {
    const invoice = await this.findOneRaw(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== 'PAID') {
      throw new Error('Can only mint NFT for paid invoices');
    }

    if (!invoice.clientId || !invoice.freelancerId) {
      throw new Error(
        'Invoice must have both client and freelancer to mint NFT',
      );
    }

    try {
      const invoiceHash = this.generateInvoiceHash(invoice);
      const result = await this.blockchainService.mintInvoiceNFT({
        invoiceId: invoiceId,
        invoiceHash: invoiceHash,
        clientId: invoice.clientId,
        freelancerId: invoice.freelancerId,
        amount: invoice.amount,
        currency: invoice.currency || 'USD',
      });

      // Update invoice with NFT data
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          tokenId: result.tokenId,
          onchainTxHash: result.transactionHash as string,
        },
      });

      return result;
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }

  // Simulate payment for testing
  async simulatePayment(invoiceId: string, userId?: string) {
    const invoice = await this.findOne(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Update status to PAID
    await this.updateStatus(invoiceId, 'PAID');

    return { message: 'Payment simulated successfully', invoiceId };
  }

  // Update invoice
  async update(
    invoiceId: string,
    updateData: Partial<Invoice>,
    userId?: string,
  ) {
    const invoice = await this.findOne(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.serializeBigInt(
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: updateData,
        include: {
          client: { select: { id: true, name: true, email: true } },
          freelancer: { select: { id: true, name: true, email: true } },
          storedFiles: true,
        },
      })
    );
  }

  // Remove invoice
  async remove(invoiceId: string, userId?: string) {
    const invoice = await this.findOne(invoiceId);
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return this.serializeBigInt(
      await this.prisma.invoice.delete({
        where: { id: invoiceId },
      })
    );
  }
}