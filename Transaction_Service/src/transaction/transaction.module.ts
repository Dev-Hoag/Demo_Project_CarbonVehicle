import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction } from './transaction.entity';
import { EventPublisherService } from '../events/event-publisher.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService, EventPublisherService],
  exports: [TransactionService],
})
export class TransactionModule {}
