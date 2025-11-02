import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/Prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET ?? '', {
      apiVersion: '2022-11-15' as unknown as '2025-10-29.clover',
    });
  }

  // Helper to serialize BigInt fields for JSON responses
  private serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(item => this.serializeBigInt(item));
    if (typeof obj === 'object') {
      const serialized: any = {};
      for (const key in obj) {
        serialized[key] = this.serializeBigInt(obj[key]);
      }
      return serialized;
    }
    return obj;
  }

  async createPaymentIntent(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'DRAFT' && invoice.status !== 'SENT') {
      throw new BadRequestException('Invoice not payable in current state');
    }

    const amount = Math.round(invoice.amount * 100);
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { invoiceId },
    });

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return { client_secret: paymentIntent.client_secret, id: paymentIntent.id };
  }

  async handlePaymentIntentSucceeded(intentId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { stripePaymentIntentId: intentId },
    });
    if (!invoice) return null;
    // mark invoice as PAID (escrow held)
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' },
    });
    return this.serializeBigInt(updatedInvoice);
  }

  // test helper: mark invoice PAID without Stripe (simulates successful payment)
  async simulateMarkPaid(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'DRAFT' && invoice.status !== 'SENT') {
      throw new BadRequestException('Invoice not payable in current state');
    }
    return this.serializeBigInt(await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID' },
    }));
  }

  async releaseEscrow(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'PAID')
      throw new BadRequestException('Invoice not in PAID state');

    return this.serializeBigInt(await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'RELEASED', releasedAt: new Date() },
    }));
  }
}
