import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PrismaService } from 'src/common/Prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { BlockchainService } from 'src/blockchain/blockchain.service';

@Module({
  imports: [AuthModule],
  providers: [InvoicesService, PrismaService, BlockchainService],
  controllers: [InvoicesController],
  exports: [InvoicesService],
})
export class InvoicesModule {}
