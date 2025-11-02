import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/Prisma.service';
import { MongoDBService } from '../mongodb/mongodb.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DatabaseSyncService {
  private readonly logger = new Logger(DatabaseSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mongodb: MongoDBService,
  ) {}

  // ===== MANUAL SYNC METHODS =====
  // Called whenever data is created/updated in MySQL

  async syncUserCreated(userId: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          reputation: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      if (user) {
        await this.mongodb.syncUserToMongo(user);
        this.logger.log(`Synced user ${userId} to MongoDB`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync user ${userId}: ${error.message}`);
    }
  }

  async syncInvoiceCreated(invoiceId: string): Promise<void> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          client: true,
          freelancer: true,
          storedFiles: true,
        },
      });

      if (invoice) {
        await this.mongodb.syncInvoiceToMongo(invoice);
        
        // Log analytics event
        await this.mongodb.logEvent({
          eventType: 'invoice_created',
          userId: invoice.clientId || 'unknown',
          invoiceId: invoice.id,
          data: {
            amount: invoice.amount,
            currency: invoice.currency,
          },
        });

        this.logger.log(`Synced invoice ${invoiceId} to MongoDB`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync invoice ${invoiceId}: ${error.message}`);
    }
  }

  async syncProjectCreated(projectId: string): Promise<void> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: true,
          freelancer: true,
          skills: {
            include: {
              skill: true,
            },
          },
          reviews: true,
        },
      });

      if (project) {
        await this.mongodb.syncProjectToMongo(project);
        this.logger.log(`Synced project ${projectId} to MongoDB`);
      }
    } catch (error) {
      this.logger.error(`Failed to sync project ${projectId}: ${error.message}`);
    }
  }

  async syncNFTMinted(invoiceId: string, tokenId: string, txHash: string): Promise<void> {
    try {
      // Update MongoDB with blockchain data
      await this.mongodb.logEvent({
        eventType: 'nft_minted',
        userId: 'system',
        invoiceId,
        blockchainData: {
          tokenId,
          transactionHash: txHash,
          contractAddress: process.env.CONTRACT_ADDRESS,
        },
      });

      this.logger.log(`Synced NFT minting for invoice ${invoiceId}, token ${tokenId}`);
    } catch (error) {
      this.logger.error(`Failed to sync NFT minting: ${error.message}`);
    }
  }

  // ===== SCHEDULED SYNC METHODS =====
  // Run periodically to ensure data consistency

  @Cron(CronExpression.EVERY_HOUR)
  async syncAllUsers(): Promise<void> {
    this.logger.log('Starting scheduled user sync...');
    
    try {
      const users = await this.prisma.user.findMany({
        where: {
          updatedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
        include: {
          reputation: true,
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      for (const user of users) {
        await this.mongodb.syncUserToMongo(user);
      }

      this.logger.log(`Synced ${users.length} users to MongoDB`);
    } catch (error) {
      this.logger.error(`Scheduled user sync failed: ${error.message}`);
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async syncAllInvoices(): Promise<void> {
    this.logger.log('Starting scheduled invoice sync...');
    
    try {
      const invoices = await this.prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
          },
        },
        include: {
          client: true,
          freelancer: true,
          storedFiles: true,
        },
      });

      for (const invoice of invoices) {
        await this.mongodb.syncInvoiceToMongo(invoice);
      }

      this.logger.log(`Synced ${invoices.length} invoices to MongoDB`);
    } catch (error) {
      this.logger.error(`Scheduled invoice sync failed: ${error.message}`);
    }
  }

  // ===== ANALYTICS HELPERS =====
  // Easy methods to log events from your existing services

  async logUserLogin(userId: string, userAgent?: string, ipAddress?: string): Promise<void> {
    await this.mongodb.logEvent({
      eventType: 'user_login',
      userId,
      userAgent,
      ipAddress,
    });
  }

  async logPaymentReceived(invoiceId: string, userId: string, amount: number): Promise<void> {
    await this.mongodb.logEvent({
      eventType: 'payment_received',
      userId,
      invoiceId,
      data: { amount },
    });
  }

  async logFileUploaded(invoiceId: string, userId: string, filename: string): Promise<void> {
    await this.mongodb.logEvent({
      eventType: 'file_uploaded',
      userId,
      invoiceId,
      data: { filename },
    });
  }

  async logDisputeOpened(invoiceId: string, userId: string): Promise<void> {
    await this.mongodb.logEvent({
      eventType: 'dispute_opened',
      userId,
      invoiceId,
    });
  }

  // ===== HEALTH CHECK =====
  async checkSyncHealth(): Promise<{
    mysql: { status: string; recordCount: number };
    mongodb: { status: string; collections: string[] };
  }> {
    try {
      const [userCount, mongoHealth] = await Promise.all([
        this.prisma.user.count(),
        this.mongodb.healthCheck(),
      ]);

      return {
        mysql: {
          status: 'healthy',
          recordCount: userCount,
        },
        mongodb: mongoHealth,
      };
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`);
      return {
        mysql: { status: 'error', recordCount: 0 },
        mongodb: { status: 'error', collections: [] },
      };
    }
  }

  // ===== BULK SYNC (FOR INITIAL SETUP) =====
  async performInitialSync(): Promise<void> {
    this.logger.log('Starting initial database sync...');

    try {
      // Sync all users
      const users = await this.prisma.user.findMany({
        include: {
          reputation: true,
          skills: { include: { skill: true } },
        },
      });

      for (const user of users) {
        await this.mongodb.syncUserToMongo(user);
      }

      // Sync all invoices
      const invoices = await this.prisma.invoice.findMany({
        include: {
          client: true,
          freelancer: true,
          storedFiles: true,
        },
      });

      for (const invoice of invoices) {
        await this.mongodb.syncInvoiceToMongo(invoice);
      }

      // Sync all projects
      const projects = await this.prisma.project.findMany({
        include: {
          client: true,
          freelancer: true,
          skills: { include: { skill: true } },
          reviews: true,
        },
      });

      for (const project of projects) {
        await this.mongodb.syncProjectToMongo(project);
      }

      this.logger.log(`Initial sync completed: ${users.length} users, ${invoices.length} invoices, ${projects.length} projects`);
    } catch (error) {
      this.logger.error(`Initial sync failed: ${error.message}`);
      throw error;
    }
  }
}