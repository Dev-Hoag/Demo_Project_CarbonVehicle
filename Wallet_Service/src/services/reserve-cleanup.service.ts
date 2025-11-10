import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Reserve } from '../shared/entities/reserve.entity';
import { LessThan, Repository } from 'typeorm';
import { ReservesService } from '../modules/reserves/reserves.service';
import { ReserveStatus } from '../shared/enums';

@Injectable()
export class ReserveCleanupService {
  private readonly logger = new Logger(ReserveCleanupService.name);

  constructor(
    @InjectRepository(Reserve)
    private readonly reserveRepository: Repository<Reserve>,
    private readonly reservesService: ReservesService,
  ) {}

  /**
   * Chạy mỗi 5 phút để kiểm tra và giải phóng reserve đã hết hạn
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanupExpiredReserves() {
    this.logger.log('🔄 Starting expired reserves cleanup...');

    try {
      // Tìm tất cả reserve đã hết hạn và chưa được release
      const expiredReserves = await this.reserveRepository.find({
        where: {
          expiresAt: LessThan(new Date()),
          status: ReserveStatus.ACTIVE,
        },
        relations: ['wallet'],
      });

      if (expiredReserves.length === 0) {
        this.logger.log('✅ No expired reserves found');
        return;
      }

      this.logger.log(`🔍 Found ${expiredReserves.length} expired reserves to clean up`);

      let successCount = 0;
      let failCount = 0;

      // Giải phóng từng reserve
      for (const reserve of expiredReserves) {
        try {
          await this.reservesService.releaseFunds(reserve.transactionId);
          successCount++;
          
          this.logger.log(
            `✅ Released reserve ${reserve.id} for transaction ${reserve.transactionId} ` +
            `(${reserve.amount} VND from wallet ${reserve.wallet.userId})`,
          );
        } catch (error) {
          failCount++;
          this.logger.error(
            `❌ Failed to release reserve ${reserve.id} for transaction ${reserve.transactionId}: ${error.message}`,
            error.stack,
          );
        }
      }

      this.logger.log(
        `✅ Cleanup completed: ${successCount} released, ${failCount} failed, ${expiredReserves.length} total`,
      );
    } catch (error) {
      this.logger.error(`❌ Error during reserve cleanup: ${error.message}`, error.stack);
    }
  }

  /**
   * Chạy mỗi 1 giờ để log thống kê reserve
   */
  @Cron(CronExpression.EVERY_HOUR)
  async logReserveStatistics() {
    try {
      const totalReserves = await this.reserveRepository.count();
      const activeReserves = await this.reserveRepository.count({
        where: { status: ReserveStatus.ACTIVE },
      });
      const expiredButNotReleased = await this.reserveRepository.count({
        where: {
          expiresAt: LessThan(new Date()),
          status: ReserveStatus.ACTIVE,
        },
      });

      this.logger.log(
        `📊 Reserve Statistics: Total=${totalReserves}, Active=${activeReserves}, ` +
        `ExpiredButNotReleased=${expiredButNotReleased}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error logging reserve statistics: ${error.message}`, error.stack);
    }
  }
}
