import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/common/Prisma.service';
import { JwtAuthGuard } from './jwt.guard';
import { MongoDBModule } from '../mongodb/mongodb.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev',
      signOptions: { expiresIn: '1h' },
    }),
    MongoDBModule,
  ],
  providers: [AuthService, PrismaService, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}
