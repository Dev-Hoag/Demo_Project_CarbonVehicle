import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { InternalPaymentController } from './internal-payment.controller';
import { PaymentService } from './payment.service';
import { PaymentEventService } from './payment-event.service';
import { Payment } from '../../shared/entities/payment.entity';
import { PaymentCallback } from '../../shared/entities/payment-callback.entity';
import { PaymentEvent } from '../../shared/entities/payment-event.entity';
import { OutboxEvent } from '../../shared/entities/outbox-event.entity';
import { VNPayProvider } from '../../providers/vnpay/vnpay.provider';
import { TestPaymentProvider } from '../../providers/test/test.provider';
import { PaymentProviderFactory } from '../../providers/payment-provider.factory';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InternalApiGuard } from '../auth/guards/internal-api.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentCallback,
      PaymentEvent,
      OutboxEvent,
    ]),
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [
    PaymentController,
    WebhookController,
    InternalPaymentController,
  ],
  providers: [
    PaymentService,
    PaymentEventService,
    VNPayProvider,
    TestPaymentProvider,
    PaymentProviderFactory,
    JwtAuthGuard,
    InternalApiGuard,
  ],
  exports: [PaymentService, PaymentEventService],
})
export class PaymentModule {}