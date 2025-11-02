import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { PrismaModule } from './common/Prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InvoicesModule } from './invoices/invoices.module';
import { ValueLinkModule } from './valuelink/valuelink.module';
import { PaymentsModule } from './payments/payments.module';
import { CommonModule } from './common/common.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AiModule } from './ai/ai.module';
import { StorageModule } from './storage/storage.module';
import { DisputesModule } from './disputes/disputes.module';
import { ReputationModule } from './reputation/reputation.module';
import { RealtimeModule } from './realtime/realtime.module';
import { WorkerModule } from './worker/worker.module';
import { WorkOpportunitiesModule } from './work-opportunities/work-opportunities.module';
import { TasksModule } from './tasks/tasks.module';
import { ProjectsModule } from './projects/projects.module';
import { SkillsModule } from './skills/skills.module';
// Temporarily commented out until MongoDB issues are resolved
import { MongoDBModule } from './mongodb/mongodb.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // PrismaModule,
    // Temporarily commented out until MongoDB issues are resolved
    MongoDBModule,
    AuthModule,
    UsersModule,
    InvoicesModule,
    ValueLinkModule,
    PaymentsModule,
    BlockchainModule,
    AiModule,
    StorageModule,
    DisputesModule,
    ReputationModule,
    RealtimeModule,
    WorkerModule,
    WorkOpportunitiesModule,
    TasksModule,
    ProjectsModule,
    SkillsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
