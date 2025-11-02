import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
  Delete,
  Query,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';

class UpdateInvoiceStatusDto {
  @IsString()
  status!: string;
}

interface AuthenticatedRequest extends Request {
  user?: { sub: string; email: string; role: string };
}

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoices: InvoicesService) {}

  @Get()
  async list(@Req() req: AuthenticatedRequest) {
    // return invoices visible to the user (both client and freelancer roles)
    return this.invoices.findAllForUser(req.user?.sub);
  }

  @Post()
  async create(
    @Body() dto: CreateInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const data = { ...dto, clientId: dto.clientId ?? req.user?.sub };
    return this.invoices.create(data);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.invoices.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateInvoiceStatusDto,
  ) {
    return this.invoices.updateStatus(id, body.status);
  }

  // Blockchain verification endpoint
  @Get(':id/verify')
  async verifyInvoice(@Param('id') id: string) {
    return this.invoices.verifyInvoiceIntegrity(id);
  }

  // File attachment endpoint for IPFS integration
  @Post(':id/files')
  async attachFile(
    @Param('id') id: string,
    @Body() fileData: { filename: string; ipfsHash: string; fileSize?: number },
  ) {
    return this.invoices.attachFileToInvoice(id, fileData);
  }

  // NFT minting endpoint
  @Post(':id/mint-nft')
  async mintNFT(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.invoices.mintInvoiceNFT(id, req.user?.sub);
  }

  // Payment simulation for testing
  @Post(':id/simulate-payment')
  async simulatePayment(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.invoices.simulatePayment(id, req.user?.sub);
  }

  // Update invoice data
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.invoices.update(id, updateData, req.user?.sub);
  }

  // Delete invoice
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.invoices.remove(id, req.user?.sub);
  }
}
