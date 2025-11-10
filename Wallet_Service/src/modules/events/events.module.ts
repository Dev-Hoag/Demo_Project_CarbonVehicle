// src/modules/events/events.module.ts

import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule } from '@nestjs/config';
import { getRabbitMQConfig } from '../../config/rabbitmq.config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => getRabbitMQConfig(),
    }),
  ],
  providers: [],
  exports: [RabbitMQModule],
})
export class EventsModule {}
