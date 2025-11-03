// MongoDB Schemas Mirroring Prisma Models for Dual Database Setup
// This creates perfect synchronization between MySQL (Prisma) and MongoDB (Mongoose)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Enums (mirroring Prisma enums)
export enum Role {
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  RELEASED = 'RELEASED',
}

export enum AvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum ProjectStatus {
  PLANNING = 'PLANNING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SkillLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum VoteChoice {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
}

export enum DisputeOutcome {
  FOR = 'FOR',
  AGAINST = 'AGAINST',
  TIED = 'TIED',
}

// User Schema (Exact mirror of Prisma User model)
@Schema({ timestamps: true, collection: 'users' })
export class MongoUser extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  email: string;

  @Prop()
  name?: string;

  @Prop()
  password?: string;

  @Prop()
  walletAddress?: string;

  @Prop({ enum: Role, default: Role.FREELANCER })
  role: Role;

  // Profile fields
  @Prop()
  bio?: string;

  @Prop()
  title?: string;

  @Prop()
  location?: string;

  @Prop()
  website?: string;

  @Prop()
  profileImage?: string;

  @Prop()
  hourlyRate?: number;

  @Prop({ default: 'USD' })
  currency?: string;

  @Prop()
  yearsExperience?: number;

  // Availability
  @Prop({ enum: AvailabilityStatus, default: AvailabilityStatus.AVAILABLE })
  availability: AvailabilityStatus;

  @Prop({ default: 40 })
  hoursPerWeek?: number;

  @Prop()
  timezone?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const MongoUserSchema = SchemaFactory.createForClass(MongoUser);

// Invoice Schema (Exact mirror of Prisma Invoice model)
@Schema({ timestamps: true, collection: 'invoices' })
export class MongoInvoice extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  dueDate?: Date;

  @Prop()
  currency?: string;

  @Prop({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status: InvoiceStatus;

  @Prop()
  clientId?: string;

  @Prop()
  freelancerId?: string;

  @Prop()
  stripePaymentIntentId?: string;

  @Prop()
  releasedAt?: Date;

  @Prop()
  tokenId?: string; // BigInt converted to string for MongoDB

  @Prop()
  onchainTxHash?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoInvoiceSchema = SchemaFactory.createForClass(MongoInvoice);

// Project Schema (Exact mirror of Prisma Project model)
@Schema({ timestamps: true, collection: 'projects' })
export class MongoProject extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  budget?: number;

  @Prop()
  actualCost?: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status: ProjectStatus;

  @Prop({ enum: DifficultyLevel })
  difficulty?: DifficultyLevel;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  deadline?: Date;

  @Prop({ required: true })
  clientId: string;

  @Prop()
  freelancerId?: string;

  @Prop()
  invoiceId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const MongoProjectSchema = SchemaFactory.createForClass(MongoProject);

// Skill Schema (Exact mirror of Prisma Skill model)
@Schema({ timestamps: true, collection: 'skills' })
export class MongoSkill extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  description?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoSkillSchema = SchemaFactory.createForClass(MongoSkill);

// UserSkill Schema (Exact mirror of Prisma UserSkill model)
@Schema({ timestamps: true, collection: 'userskills' })
export class MongoUserSkill extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  skillId: string;

  @Prop({ enum: SkillLevel, default: SkillLevel.INTERMEDIATE })
  level: SkillLevel;

  @Prop({ default: false })
  verified: boolean;
}

export const MongoUserSkillSchema =
  SchemaFactory.createForClass(MongoUserSkill);

// Review Schema (Exact mirror of Prisma Review model)
@Schema({ timestamps: true, collection: 'reviews' })
export class MongoReview extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  targetId: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ min: 1, max: 5 })
  quality?: number;

  @Prop({ min: 1, max: 5 })
  communication?: number;

  @Prop({ min: 1, max: 5 })
  timeliness?: number;

  @Prop({ min: 1, max: 5 })
  professionalism?: number;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoReviewSchema = SchemaFactory.createForClass(MongoReview);

// StoredFile Schema (Exact mirror of Prisma StoredFile model)
@Schema({ timestamps: true, collection: 'storedfiles' })
export class MongoStoredFile extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop()
  invoiceId?: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  ipfsHash: string;

  @Prop()
  fileSize?: number;

  @Prop({ required: true, unique: true })
  metadataHash: string;

  @Prop()
  encryptedBase64?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoStoredFileSchema =
  SchemaFactory.createForClass(MongoStoredFile);

// Dispute Schema (Exact mirror of Prisma Dispute model)
@Schema({ timestamps: true, collection: 'disputes' })
export class MongoDispute extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  invoiceId: string;

  @Prop({ required: true })
  openerId: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: false })
  resolved: boolean;

  @Prop({ enum: DisputeOutcome })
  outcome?: DisputeOutcome;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoDisputeSchema = SchemaFactory.createForClass(MongoDispute);

// DisputeVote Schema (Exact mirror of Prisma DisputeVote model)
@Schema({ timestamps: true, collection: 'disputevotes' })
export class MongoDisputeVote extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  disputeId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: VoteChoice })
  vote: VoteChoice;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoDisputeVoteSchema =
  SchemaFactory.createForClass(MongoDisputeVote);

// Reputation Schema (Exact mirror of Prisma Reputation model)
@Schema({ timestamps: true, collection: 'reputations' })
export class MongoReputation extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ default: 0.0 })
  score: number;

  @Prop({ default: 0 })
  completedProjects: number;

  @Prop({ default: 0.0 })
  totalEarnings: number;

  @Prop({ default: 0.0 })
  averageRating: number;

  @Prop()
  responseTime?: number;

  @Prop({ default: 0.0 })
  onTimeDelivery: number;

  @Prop({ default: 0.0 })
  qualityScore: number;

  @Prop({ default: 0.0 })
  communicationScore: number;

  @Prop({ default: 0.0 })
  timelinessScore: number;

  @Prop({ default: 0.0 })
  professionalismScore: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoReputationSchema =
  SchemaFactory.createForClass(MongoReputation);

// ValueLink Schema (Exact mirror of Prisma ValueLink model)
@Schema({ timestamps: true, collection: 'valuelinks' })
export class MongoValueLink extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  fromUserId: string;

  @Prop({ required: true })
  toUserId: string;

  @Prop()
  projectId?: number; // Int? in Prisma

  @Prop({ default: 0 })
  valueScore: number; // Int in Prisma

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const MongoValueLinkSchema =
  SchemaFactory.createForClass(MongoValueLink);

// ProjectSkill Schema (Missing from MongoDB - exact mirror of Prisma ProjectSkill model)
@Schema({ timestamps: true, collection: 'projectskills' })
export class MongoProjectSkill extends Document {
  @Prop({ required: true, unique: true })
  id: string; // UUID from Prisma

  @Prop({ required: true })
  projectId: string;

  @Prop({ required: true })
  skillId: string;

  @Prop({ default: true })
  required: boolean;
}

export const MongoProjectSkillSchema =
  SchemaFactory.createForClass(MongoProjectSkill);

// Additional MongoDB-specific schemas for analytics and file storage
@Schema({ timestamps: true, collection: 'analytics' })
export class MongoAnalytics extends Document {
  @Prop({
    required: true,
    enum: [
      'invoice_created',
      'payment_received',
      'nft_minted',
      'file_uploaded',
      'user_login',
      'dispute_opened',
    ],
  })
  eventType: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ index: true })
  invoiceId?: string;

  @Prop({ type: Object })
  data?: any;

  @Prop()
  userAgent?: string;

  @Prop()
  ipAddress?: string;

  @Prop({
    type: {
      transactionHash: String,
      tokenId: String,
      contractAddress: String,
      gasUsed: Number,
      networkFee: Number,
    },
  })
  blockchainData?: {
    transactionHash?: string;
    tokenId?: string;
    contractAddress?: string;
    gasUsed?: number;
    networkFee?: number;
  };

  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

export const MongoAnalyticsSchema =
  SchemaFactory.createForClass(MongoAnalytics);

@Schema({ timestamps: true, collection: 'applogs' })
export class MongoAppLog extends Document {
  @Prop({
    required: true,
    enum: ['error', 'warn', 'info', 'debug'],
  })
  level: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: ['backend', 'frontend', 'blockchain', 'database'],
  })
  service: string;

  @Prop({ type: Object })
  error?: any;

  @Prop()
  requestId?: string;

  @Prop()
  userId?: string;

  @Prop()
  endpoint?: string;

  @Prop()
  method?: string;

  @Prop({ type: Object })
  metadata?: any;

  @Prop({ default: Date.now, index: true })
  timestamp: Date;
}

export const MongoAppLogSchema = SchemaFactory.createForClass(MongoAppLog);

// Create indexes for performance (only non-unique indexes or compound indexes)
MongoUserSchema.index({ email: 1 }); // email needs index but not unique to allow multiple OAuth accounts
// Note: walletAddress partial filter unique index is managed manually in MongoDB Atlas
MongoInvoiceSchema.index({ clientId: 1, status: 1 });
MongoInvoiceSchema.index({ freelancerId: 1, status: 1 });
MongoInvoiceSchema.index({ onchainTxHash: 1 });
MongoProjectSchema.index({ clientId: 1, status: 1 });
MongoProjectSchema.index({ freelancerId: 1, status: 1 });
// Note: projectId+skillId and userId+skillId unique indexes are already created by @Prop({ unique: true })
// Note: projectId+authorId+targetId unique index is already created by @Prop({ unique: true })
MongoStoredFileSchema.index({ invoiceId: 1 });
MongoStoredFileSchema.index({ ipfsHash: 1 });
MongoDisputeSchema.index({ invoiceId: 1 });
// Note: MongoReputation userId is already unique, no need for additional index
MongoAnalyticsSchema.index({ eventType: 1, timestamp: -1 });
MongoAnalyticsSchema.index({ userId: 1, timestamp: -1 }); // compound index covers userId indexing
MongoAppLogSchema.index({ level: 1, timestamp: -1 });
MongoAppLogSchema.index({ service: 1, timestamp: -1 });
