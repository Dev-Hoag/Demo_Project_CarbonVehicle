import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentRequest,
  PaymentResponse,
  CallbackVerifyResult,
  IPaymentProvider,
} from './../../shared/interfaces/payment-provider.interface';

/**
 * Test/Mock payment provider for development
 */
@Injectable()
export class TestPaymentProvider implements IPaymentProvider {
  private readonly logger = new Logger(TestPaymentProvider.name);

  async createPayment(request: CreatePaymentRequest): Promise<PaymentResponse> {
    this.logger.log(`[TEST] Creating mock payment for: ${request.paymentCode}`);

    // Fake payment URL that auto-completes after 3 seconds
    const paymentUrl = `http://localhost:3007/api/payments/test/mock?paymentCode=${request.paymentCode}&amount=${request.amount}`;

    // Simulate gateway delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      paymentUrl,
    };
  }

  verifyCallback(params: any): CallbackVerifyResult {
    this.logger.log(`[TEST] Verifying mock callback for: ${params.paymentCode}`);

    // Auto approve all test payments
    return {
      isValid: true,
      paymentCode: params.paymentCode,
      responseCode: '00',
      amount: parseFloat(params.amount || '0'),
      transactionNo: `TEST_${Date.now()}`,
    };
  }
}