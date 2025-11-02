import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  MongoUser,
  MongoInvoice,
  MongoProject,
  MongoSkill,
  MongoUserSkill,
  MongoProjectSkill,
  MongoReview,
  MongoStoredFile,
  MongoDispute,
  MongoDisputeVote,
  MongoReputation,
  MongoValueLink,
  MongoAnalytics,
  MongoAppLog,
} from './schemas';

@Injectable()
export class MongoDBService {
  private readonly logger = new Logger(MongoDBService.name);

  constructor(
    @InjectModel(MongoUser.name) private userModel: Model<MongoUser>,
    @InjectModel(MongoInvoice.name) private invoiceModel: Model<MongoInvoice>,
    @InjectModel(MongoProject.name) private projectModel: Model<MongoProject>,
    @InjectModel(MongoSkill.name) private skillModel: Model<MongoSkill>,
    @InjectModel(MongoUserSkill.name) private userSkillModel: Model<MongoUserSkill>,
    @InjectModel(MongoProjectSkill.name) private projectSkillModel: Model<MongoProjectSkill>,
    @InjectModel(MongoReview.name) private reviewModel: Model<MongoReview>,
    @InjectModel(MongoStoredFile.name) private storedFileModel: Model<MongoStoredFile>,
    @InjectModel(MongoDispute.name) private disputeModel: Model<MongoDispute>,
    @InjectModel(MongoDisputeVote.name) private disputeVoteModel: Model<MongoDisputeVote>,
    @InjectModel(MongoReputation.name) private reputationModel: Model<MongoReputation>,
    @InjectModel(MongoValueLink.name) private valueLinkModel: Model<MongoValueLink>,
    @InjectModel(MongoAnalytics.name) private analyticsModel: Model<MongoAnalytics>,
    @InjectModel(MongoAppLog.name) private appLogModel: Model<MongoAppLog>,
  ) {}

  // ===== SYNCHRONIZATION METHODS =====
  // These methods sync data between MySQL (Prisma) and MongoDB (Mongoose)

  async syncUserToMongo(prismaUser: any): Promise<MongoUser> {
    try {
      const mongoUser = await this.userModel.findOneAndUpdate(
        { id: prismaUser.id },
        {
          ...prismaUser,
          // Convert BigInt and other types if needed
          createdAt: new Date(prismaUser.createdAt),
          updatedAt: new Date(prismaUser.updatedAt),
        },
        { upsert: true, new: true }
      );
      
      this.logger.log(`Synced user ${prismaUser.id} to MongoDB`);
      return mongoUser;
    } catch (error) {
      this.logger.error(`Failed to sync user to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async syncInvoiceToMongo(prismaInvoice: any): Promise<MongoInvoice> {
    try {
      const mongoInvoice = await this.invoiceModel.findOneAndUpdate(
        { id: prismaInvoice.id },
        {
          ...prismaInvoice,
          // Convert BigInt to string for MongoDB
          tokenId: prismaInvoice.tokenId ? prismaInvoice.tokenId.toString() : undefined,
          createdAt: new Date(prismaInvoice.createdAt),
        },
        { upsert: true, new: true }
      );
      
      this.logger.log(`Synced invoice ${prismaInvoice.id} to MongoDB`);
      return mongoInvoice;
    } catch (error) {
      this.logger.error(`Failed to sync invoice to MongoDB: ${error.message}`);
      throw error;
    }
  }

  async syncProjectToMongo(prismaProject: any): Promise<MongoProject> {
    try {
      const mongoProject = await this.projectModel.findOneAndUpdate(
        { id: prismaProject.id },
        {
          ...prismaProject,
          createdAt: new Date(prismaProject.createdAt),
          updatedAt: new Date(prismaProject.updatedAt),
        },
        { upsert: true, new: true }
      );
      
      this.logger.log(`Synced project ${prismaProject.id} to MongoDB`);
      return mongoProject;
    } catch (error) {
      this.logger.error(`Failed to sync project to MongoDB: ${error.message}`);
      throw error;
    }
  }

  // ===== ANALYTICS METHODS =====
  // MongoDB excels at analytics and logging

  async logEvent(eventData: {
    eventType: 'invoice_created' | 'payment_received' | 'nft_minted' | 'file_uploaded' | 'user_login' | 'dispute_opened';
    userId: string;
    invoiceId?: string;
    data?: any;
    userAgent?: string;
    ipAddress?: string;
    blockchainData?: {
      transactionHash?: string;
      tokenId?: string;
      contractAddress?: string;
      gasUsed?: number;
      networkFee?: number;
    };
  }): Promise<MongoAnalytics> {
    try {
      const analytics = new this.analyticsModel({
        ...eventData,
        timestamp: new Date(),
      });
      
      await analytics.save();
      this.logger.log(`Logged analytics event: ${eventData.eventType} for user ${eventData.userId}`);
      return analytics;
    } catch (error) {
      this.logger.error(`Failed to log analytics event: ${error.message}`);
      throw error;
    }
  }

  async logAppEvent(logData: {
    level: 'error' | 'warn' | 'info' | 'debug';
    message: string;
    service: 'backend' | 'frontend' | 'blockchain' | 'database';
    error?: any;
    requestId?: string;
    userId?: string;
    endpoint?: string;
    method?: string;
    metadata?: any;
  }): Promise<MongoAppLog> {
    try {
      const appLog = new this.appLogModel({
        ...logData,
        timestamp: new Date(),
      });
      
      await appLog.save();
      
      // Only log non-debug messages to console to avoid spam
      if (logData.level !== 'debug') {
        this.logger.log(`App log: ${logData.level} - ${logData.message}`);
      }
      
      return appLog;
    } catch (error) {
      this.logger.error(`Failed to log app event: ${error.message}`);
      throw error;
    }
  }

  // ===== QUERY METHODS =====
  // MongoDB-specific queries for better performance

  async getUserAnalytics(userId: string, days: number = 30): Promise<any[]> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return this.analyticsModel.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: fromDate }
        }
      },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          lastEvent: { $max: '$timestamp' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  }

  async getSystemMetrics(days: number = 7): Promise<any> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const [analytics, logs] = await Promise.all([
      this.analyticsModel.aggregate([
        {
          $match: { timestamp: { $gte: fromDate } }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
            },
            events: { $sum: 1 },
            uniqueUsers: { $addToSet: '$userId' }
          }
        },
        {
          $project: {
            date: '$_id',
            events: 1,
            uniqueUsers: { $size: '$uniqueUsers' }
          }
        },
        {
          $sort: { date: 1 }
        }
      ]),
      
      this.appLogModel.aggregate([
        {
          $match: { timestamp: { $gte: fromDate } }
        },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    return {
      dailyAnalytics: analytics,
      logLevels: logs
    };
  }

  // ===== FILE STORAGE METHODS =====
  // MongoDB excels at file metadata storage

  async storeFileMetadata(fileData: {
    id: string;
    invoiceId?: string;
    filename: string;
    ipfsHash: string;
    fileSize?: number;
    metadataHash: string;
    encryptedBase64?: string;
  }): Promise<MongoStoredFile> {
    try {
      const storedFile = new this.storedFileModel({
        ...fileData,
        createdAt: new Date(),
      });
      
      await storedFile.save();
      this.logger.log(`Stored file metadata: ${fileData.filename}`);
      return storedFile;
    } catch (error) {
      this.logger.error(`Failed to store file metadata: ${error.message}`);
      throw error;
    }
  }

  async getFilesByInvoice(invoiceId: string): Promise<MongoStoredFile[]> {
    return this.storedFileModel.find({ invoiceId }).sort({ createdAt: -1 });
  }

  // ===== REPUTATION METHODS =====
  // Real-time reputation calculations

  async updateReputation(userId: string, updates: Partial<any>): Promise<MongoReputation> {
    return this.reputationModel.findOneAndUpdate(
      { userId },
      {
        ...updates,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );
  }

  // ===== SEARCH METHODS =====
  // MongoDB's text search capabilities

  async searchUsers(query: string): Promise<any[]> {
    try {
      return await this.userModel.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } },
          { bio: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      }).limit(20);
    } catch (error) {
      this.logger.error(`User search failed: ${error.message}`);
      return [];
    }
  }

  async searchProjects(query: string): Promise<any[]> {
    try {
      return await this.projectModel.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
        ],
      }).limit(20);
    } catch (error) {
      this.logger.error(`Project search failed: ${error.message}`);
      return [];
    }
  }

  // ===== HEALTH CHECK =====
  async healthCheck(): Promise<{ status: string; collections: string[] }> {
    try {
      // Simple connection test
      const testDoc = await this.userModel.findOne().limit(1);
      
      return {
        status: 'healthy',
        collections: ['Connected to MongoDB successfully'],
      };
    } catch (error) {
      this.logger.error(`MongoDB health check failed: ${error.message}`);
      return {
        status: 'unhealthy',
        collections: [],
      };
    }
  }
}