import { Injectable, BadRequestException } from '@nestjs/common';
import { VNPayProvider } from './vnpay/vnpay.provider';
import { TestPaymentProvider } from './test/test.provider';
import { IPaymentProvider } from './../shared/interfaces/payment-provider.interface';
import { PaymentGateway } from './../shared/enums/payment.enums';

@Injectable()
export class PaymentProviderFactory {
  constructor(
    private readonly vnpayProvider: VNPayProvider,
    private readonly testProvider: TestPaymentProvider,
  ) {}

  getProvider(gateway: PaymentGateway): IPaymentProvider {
    switch (gateway) {
      case PaymentGateway.VNPAY:
        return this.vnpayProvider;
      case PaymentGateway.TEST:
        return this.testProvider;
      case PaymentGateway.MOMO:
        throw new BadRequestException('MoMo chưa được tích hợp');
      case PaymentGateway.BANK:
        throw new BadRequestException('Banking chưa được tích hợp');
      default:
        throw new BadRequestException(`Gateway không hợp lệ: ${gateway}`);
    }
  }
}