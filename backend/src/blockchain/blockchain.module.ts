import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { PrismaService } from 'src/common/Prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [BlockchainService, PrismaService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
