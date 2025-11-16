import { Module } from '@nestjs/common';
import { EventConsumerService } from './event-consumer.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  providers: [EventConsumerService],
  exports: [EventConsumerService],
})
export class EventsModule {}
