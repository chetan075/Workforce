import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongoDBService } from './mongodb.service';
import { DatabaseSyncService } from './database-sync.service';
import { DatabaseController } from './database.controller';
import { CommonModule } from '../common/common.module';
import {
  MongoUser,
  MongoUserSchema,
  MongoInvoice,
  MongoInvoiceSchema,
  MongoProject,
  MongoProjectSchema,
  MongoSkill,
  MongoSkillSchema,
  MongoUserSkill,
  MongoUserSkillSchema,
  MongoProjectSkill,
  MongoProjectSkillSchema,
  MongoReview,
  MongoReviewSchema,
  MongoStoredFile,
  MongoStoredFileSchema,
  MongoDispute,
  MongoDisputeSchema,
  MongoDisputeVote,
  MongoDisputeVoteSchema,
  MongoReputation,
  MongoReputationSchema,
  MongoValueLink,
  MongoValueLinkSchema,
  MongoAnalytics,
  MongoAnalyticsSchema,
  MongoAppLog,
  MongoAppLogSchema,
} from './schemas';

@Module({
  imports: [
    CommonModule, // For PrismaService
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/chainbill',
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      // Core business models (mirroring Prisma)
      { name: MongoUser.name, schema: MongoUserSchema },
      { name: MongoInvoice.name, schema: MongoInvoiceSchema },
      { name: MongoProject.name, schema: MongoProjectSchema },
      { name: MongoSkill.name, schema: MongoSkillSchema },
      { name: MongoUserSkill.name, schema: MongoUserSkillSchema },
      { name: MongoProjectSkill.name, schema: MongoProjectSkillSchema },
      { name: MongoReview.name, schema: MongoReviewSchema },
      { name: MongoStoredFile.name, schema: MongoStoredFileSchema },
      { name: MongoDispute.name, schema: MongoDisputeSchema },
      { name: MongoDisputeVote.name, schema: MongoDisputeVoteSchema },
      { name: MongoReputation.name, schema: MongoReputationSchema },
      { name: MongoValueLink.name, schema: MongoValueLinkSchema },
      
      // MongoDB-specific models for analytics and logging
      { name: MongoAnalytics.name, schema: MongoAnalyticsSchema },
      { name: MongoAppLog.name, schema: MongoAppLogSchema },
    ]),
  ],
  controllers: [DatabaseController],
  providers: [MongoDBService, DatabaseSyncService],
  exports: [MongoDBService, DatabaseSyncService, MongooseModule],
})
export class MongoDBModule {}