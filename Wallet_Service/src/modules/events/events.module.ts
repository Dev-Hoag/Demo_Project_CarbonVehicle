// src/modules/events/events.module.ts

import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { getRabbitMQConfig } from '../../config/rabbitmq.config';
import { WalletEventPublisher } from './wallet-event.publisher';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => getRabbitMQConfig(),
    }),
  ],
  providers: [WalletEventPublisher],
  exports: [RabbitMQModule, WalletEventPublisher],
})
export class EventsModule {}
