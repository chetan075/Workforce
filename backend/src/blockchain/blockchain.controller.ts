import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import { BlockchainService } from './blockchain.service';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { Response } from 'express';

class ChallengeDto {
  @IsString()
  address!: string;
}

class VerifyDto {
  @IsString()
  address!: string;
  @IsString()
  signature!: string;
  // hex-encoded public key (optional for development, required for production)
  @IsOptional()
  @IsString()
  publicKey?: string;
}

@Controller('blockchain')
export class BlockchainController {
  constructor(private service: BlockchainService) {}

  @Post('auth/request-challenge')
  requestChallenge(@Body() dto: ChallengeDto) {
    return this.service.requestChallenge(dto.address);
  }

  @Post('auth/verify')
  async verify(
    @Body() dto: VerifyDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const out = await this.service.verifySignature(
      dto.address,
      dto.signature,
      dto.publicKey,
    );
    if (!out) throw new UnauthorizedException('signature verification failed');
    // set HttpOnly cookie for the access token to support cookie-based auth
    if (out?.access_token) {
      const secure = process.env.NODE_ENV === 'production';
      const cookieName = process.env.COOKIE_NAME ?? 'jid';
      res.cookie(cookieName, out.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      });
    }
    return out;
  }

  // Dev-only quick endpoints to test minting without going through JWT auth.
  // Only enabled when NODE_ENV === 'development'
  @Post('dev/mint-invoice/:invoiceId')
  async devMintInvoice(@Param('invoiceId') invoiceId: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException(
        'Dev mint endpoint is only available in development',
      );
    }
    return this.service.mintInvoiceNFTLegacy(invoiceId);
  }

  @Post('dev/mint-sbt/:userId')
  async devMintSBT(@Param('userId') userId: string) {
    if (process.env.NODE_ENV !== 'development') {
      throw new ForbiddenException(
        'Dev mint endpoint is only available in development',
      );
    }
    return this.service.mintReputationSBT(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mint-invoice/:invoiceId')
  async mintInvoice(@Param('invoiceId') invoiceId: string, @Req() req: any) {
    // req.user.sub contains wallet address per verifySignature
    return this.service.mintInvoiceNFTLegacy(invoiceId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mint-invoice-enhanced')
  async mintInvoiceEnhanced(
    @Body() invoiceData: {
      invoiceId: string;
      invoiceHash: string;
      clientId: string;
      freelancerId: string;
      amount: number;
      currency: string;
    },
    @Req() req: any,
  ) {
    // Enhanced NFT minting with complete metadata
    return this.service.mintInvoiceNFT(invoiceData);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mint-sbt/:userId')
  async mintSBT(@Param('userId') userId: string) {
    return this.service.mintReputationSBT(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('publish')
  async publishModule() {
    // requires APTOS_PRIVATE_KEY to be set in the environment of the server
    return this.service.publishEscrowModule();
  }

  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  async initializeContract() {
    // Initialize contract storage (alternative to full deployment)
    return this.service.initializeContract();
  }

  @UseGuards(JwtAuthGuard)
  @Get('trust/:userId')
  async getUserTrustScore(@Param('userId') userId: string) {
    return this.service.getUserTrustScore(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('trust/update')
  async updateTrustScore(
    @Body() data: {
      userId: string;
      scoreChange: number;
      reason: string;
    },
  ) {
    return this.service.recordTrustScoreUpdate(
      data.userId,
      data.scoreChange,
      data.reason,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('transaction/:txHash')
  async getTransactionStatus(@Param('txHash') txHash: string) {
    // Mock implementation - in real app, this would check blockchain
    return {
      hash: txHash,
      status: 'confirmed',
      blockHeight: 12345,
      gasUsed: 0.001,
    };
  }
}
