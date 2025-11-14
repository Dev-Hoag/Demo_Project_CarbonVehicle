// src/modules/consumers/consumers.module.ts
// Dedicated module to register all RabbitMQ consumers so that
// @golevelup/nestjs-rabbitmq can discover them reliably.
// We import feature modules that provide required services.

import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ReservesModule } from '../reserves/reserves.module';
import { WalletsModule } from '../wallets/wallets.module';
import { TransactionEventConsumer } from '../../consumers/transaction-event.consumer';
import { PaymentEventConsumer } from '../../consumers/payment-event.consumer';
import { UserEventConsumer } from '../../consumers/user-event.consumer';

@Module({
  imports: [EventsModule, ReservesModule, WalletsModule],
  providers: [TransactionEventConsumer, PaymentEventConsumer, UserEventConsumer],
})
export class ConsumersModule {}
