// src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentEventConsumer } from './payment-event.consumer';
import { getRabbitMQConfig } from './rabbitmq.config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => getRabbitMQConfig(),
    }),
  ],
  providers: [PaymentEventConsumer],
  exports: [RabbitMQModule],
})
export class EventsModule {}
