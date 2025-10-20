import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Interval } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Outbox } from '../../shared/entities/outbox.entity';

@Injectable()
export class OutboxPublisher {
  private readonly logger = new Logger(OutboxPublisher.name);
  private readonly endpoint = process.env.EVENT_BUS_URL ?? ''; // có thể để trống => chỉ log

  constructor(
    @InjectRepository(Outbox) private readonly outboxRepo: Repository<Outbox>,
    private readonly http: HttpService,
  ) {}

  @Interval(5000)
  async publish() {
    // lấy 50 event chưa xử lý
    const rows = await this.outboxRepo.find({
      where: { processedAt: IsNull() },
      order: { createdAt: 'ASC' },
      take: 50,
    });

    for (const row of rows) {
      try {
        // demo: nếu có EVENT_BUS_URL thì bắn HTTP, không thì chỉ log
        if (this.endpoint) {
          await firstValueFrom(this.http.post(this.endpoint, row));
        } else {
          this.logger.debug(`Outbox #${row.id} -> ${row.eventType} ${JSON.stringify(row.payload)}`);
        }
        await this.outboxRepo.update(row.id, { processedAt: new Date() });
      } catch (e: any) {
        // để processedAt = null cho lần retry sau
        this.logger.error(`Publish outbox #${row.id} fail: ${e?.message ?? e}`);
      }
    }
  }
}
