// src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRabbitMQConfig } from './rabbitmq.config';
import { PaymentEventConsumer } from './payment-event.consumer';
import { UserEventConsumer } from './user-event.consumer';
import { AdminEventPublisher } from './admin-event.publisher';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { ManagedUser } from '../../shared/entities/managed-user.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ManagedTransaction, ManagedUser]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        return getRabbitMQConfig();
      },
      inject: [ConfigService],
    }),
  ],
  providers: [PaymentEventConsumer, UserEventConsumer, AdminEventPublisher],
  exports: [PaymentEventConsumer, UserEventConsumer, AdminEventPublisher],
})
export class EventsModule {}
