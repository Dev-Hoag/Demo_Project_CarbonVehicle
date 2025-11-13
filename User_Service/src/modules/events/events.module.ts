// src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEventConsumer } from './payment-event.consumer';
import { UserEventPublisher } from './user-event.publisher';
import { AdminEventConsumer } from './admin-event.consumer';
import { getRabbitMQConfig } from './rabbitmq.config';
import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserProfile]),
    RabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => getRabbitMQConfig(),
    }),
  ],
  providers: [PaymentEventConsumer, UserEventPublisher, AdminEventConsumer],
  exports: [RabbitMQModule, UserEventPublisher],
})
export class EventsModule {}
