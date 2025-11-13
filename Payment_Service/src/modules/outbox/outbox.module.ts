import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { OutboxEvent } from '../../shared/entities/outbox-event.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxEvent]),
    ScheduleModule.forRoot(),
  ],
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}