import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { InternalApiGuard } from '../auth/guards/internal-api.guard';

@ApiTags('internal-payment')
@Controller('internal/payments')
@UseGuards(InternalApiGuard)
@ApiSecurity('internal-api-key')
export class InternalPaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('transaction/:transactionId')
  @ApiOperation({
    summary: 'Get payment by transaction ID',
    description: 'For Transaction Service to check payment status',
  })
  async getByTransactionId(@Param('transactionId') transactionId: string) {
    const payment = await this.paymentService.getByTransactionId(transactionId);

    if (!payment) {
      return {
        found: false,
        payment: null,
      };
    }

    return {
      found: true,
      payment: {
        paymentCode: payment.paymentCode,
        status: payment.status,
        amount: Number(payment.amount),
        gateway: payment.gateway,
        completedAt: payment.completedAt,
      },
    };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate payment',
    description: 'For Wallet Service to validate before settlement',
  })
  async validatePayment(@Body() body: { paymentCode: string }) {
    const payment = await this.paymentService.getPaymentStatus(body.paymentCode);

    return {
      isValid: payment.status === 'COMPLETED',
      status: payment.status,
      amount: payment.amount,
    };
  }
}