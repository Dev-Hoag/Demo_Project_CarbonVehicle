// src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRabbitMQConfig } from './rabbitmq.config';
import { PaymentEventConsumer } from './payment-event.consumer';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ManagedTransaction]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        return getRabbitMQConfig();
      },
      inject: [ConfigService],
    }),
  ],
  providers: [PaymentEventConsumer],
  exports: [PaymentEventConsumer],
})
export class EventsModule {}
