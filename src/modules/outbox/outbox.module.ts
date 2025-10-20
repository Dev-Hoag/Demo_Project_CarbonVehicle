import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { Outbox } from '../../shared/entities/outbox.entity';
import { OutboxPublisher } from './outbox.publisher';

@Module({
  imports: [
    TypeOrmModule.forFeature([Outbox]),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  providers: [OutboxPublisher],
  exports: [TypeOrmModule], // để service khác inject Repository<Outbox>
})
export class OutboxModule {}
