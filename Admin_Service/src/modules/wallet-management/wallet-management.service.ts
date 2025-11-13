import {
  Injectable,
  BadRequestException,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedWalletTransaction } from '../../shared/entities/managed-wallet-transaction.entity';
import { WalletActionAudit } from '../../shared/entities/wallet-action-audit.entity';
import { WalletServiceClient } from '../../shared/services/wallet-service-client.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { WalletTransactionStatus } from '../../shared/enums/admin.enums';
import { FilterWalletTransactionDto } from '../../shared/dtos/wallet-management.dto';

@Injectable()
export class WalletManagementService {
  constructor(
    @InjectRepository(ManagedWalletTransaction)
    private readonly walletRepo: Repository<ManagedWalletTransaction>,
    @InjectRepository(WalletActionAudit)
    private readonly actionAuditRepo: Repository<WalletActionAudit>,
    private readonly walletClient: WalletServiceClient,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ========== READ OPERATIONS ==========

  async getAllWalletTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: FilterWalletTransactionDto,
  ) {
    const q = this.walletRepo.createQueryBuilder('w');

    const where: string[] = [];
    const params: Record<string, any> = {};

    if (filters?.userId) {
      where.push('w.userId = :userId');
      params.userId = filters.userId;
    }
    if (filters?.status) {
      where.push('w.status = :status');
      params.status = filters.status;
    }
    if (filters?.transactionType) {
      where.push('w.transactionType = :type');
      params.type = filters.transactionType;
    }
    if (filters?.fromDate && filters?.toDate) {
      where.push('w.createdAt BETWEEN :from AND :to');
      params.from = filters.fromDate;
      params.to = filters.toDate;
    } else if (filters?.fromDate) {
      where.push('w.createdAt >= :from');
      params.from = filters.fromDate;
    } else if (filters?.toDate) {
      where.push('w.createdAt <= :to');
      params.to = filters.toDate;
    }

    if (where.length) q.where(where.join(' AND '), params);

    const [data, total] = await q
      .orderBy('w.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getWalletTransactionById(id: number) {
    const wallet = await this.walletRepo.findOne({ where: { id } });
    if (!wallet) throw new NotFoundException('Wallet transaction not found');
    return wallet;
  }

  // ========== WRITE OPERATIONS ==========

  async reverseTransaction(id: number, adminId: number, reason: string) {
    const wallet = await this.walletRepo.findOne({ where: { id } });
    if (!wallet) throw new NotFoundException('Wallet transaction not found');

    if (wallet.status === WalletTransactionStatus.REVERSED) {
      throw new BadRequestException('Transaction already reversed');
    }

    const resourceId =
      wallet.externalTransactionId ??
      wallet.externalWalletId ??
      `WALLET_TX:${wallet.id}`;

    // Log before command
    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'REVERSE_WALLET_INITIATED',
      resourceType: 'WALLET',
      resourceId,
      description: `Admin initiated reverse wallet transaction: ${reason}`,
      oldValue: { status: wallet.status, amount: wallet.amount },
      newValue: { action: 'REVERSING', reason },
    });

    // 🔧 GHI AUDIT: BẮT BUỘC GÁN QUAN HỆ
    await this.actionAuditRepo.save(
      this.actionAuditRepo.create({
        actionType: 'REVERSE_INITIATED',
        reason,
        amountBefore: wallet.amount as any, // DECIMAL → có thể là string/number tùy config
        amountAfter: wallet.amount as any,
        walletTransaction: { id } as any, // ✅ quan hệ đúng tên
        performedBy: { id: adminId } as any, // ✅ wrap object
      }),
    );

    // Chọn external id để gọi downstream (ưu tiên transactionId)
    const externalId = wallet.externalTransactionId ?? resourceId;

    // Send command
    const result = await this.walletClient.reverseTransaction(
      externalId,
      adminId,
      reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'REVERSE_WALLET_FAILED',
        resourceType: 'WALLET',
        resourceId,
        description: `Failed to reverse wallet transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(
        `Wallet core unavailable: ${result.error}`,
      );
    }

    // Nếu stub → cập nhật cache local ngay
    if (result?.data?.stub) {
      await this.walletRepo.update(
        { id },
        { status: WalletTransactionStatus.REVERSED },
      );

      await this.actionAuditRepo.save(
        this.actionAuditRepo.create({
          actionType: 'REVERSE_SUCCEEDED',
          reason,
          amountBefore: wallet.amount as any,
          amountAfter: wallet.amount as any,
          walletTransaction: { id } as any,
          performedBy: { id: adminId } as any,
        }),
      );

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'REVERSE_WALLET_SUCCEEDED',
        resourceType: 'WALLET',
        resourceId,
        description: `Wallet transaction reversed (stub)`,
        oldValue: { status: wallet.status },
        newValue: { status: WalletTransactionStatus.REVERSED },
      });

      return {
        success: true,
        message: 'Wallet transaction reversed (stub). Cache updated locally.',
      };
    }

    return {
      success: true,
      message: 'Wallet transaction reversed successfully. Cache will be updated shortly.',
    };
  }

  async confirmTransaction(id: number, adminId: number, reason: string) {
    const wallet = await this.walletRepo.findOne({ where: { id } });
    if (!wallet) throw new NotFoundException('Wallet transaction not found');

    if (wallet.status !== WalletTransactionStatus.PENDING) {
      throw new BadRequestException('Can only confirm pending transactions');
    }

    const resourceId =
      wallet.externalTransactionId ??
      wallet.externalWalletId ??
      `WALLET_TX:${wallet.id}`;

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CONFIRM_WALLET_INITIATED',
      resourceType: 'WALLET',
      resourceId,
      description: `Admin initiated confirm wallet transaction: ${reason}`,
      oldValue: { status: wallet.status },
      newValue: { action: 'CONFIRMING', reason },
    });

    // 🔧 GHI AUDIT: BẮT BUỘC GÁN QUAN HỆ
    await this.actionAuditRepo.save(
      this.actionAuditRepo.create({
        actionType: 'CONFIRM_INITIATED',
        reason,
        amountBefore: wallet.amount as any,
        amountAfter: wallet.amount as any,
        walletTransaction: { id } as any, // ✅
        performedBy: { id: adminId } as any, // ✅
      }),
    );

    const externalId = wallet.externalTransactionId ?? resourceId;

    const result = await this.walletClient.confirmTransaction(
      externalId,
      adminId,
      reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CONFIRM_WALLET_FAILED',
        resourceType: 'WALLET',
        resourceId,
        description: `Failed to confirm wallet transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(
        `Wallet core unavailable: ${result.error}`,
      );
    }

    if (result?.data?.stub) {
      const now = new Date();
      await this.walletRepo.update(
        { id },
        { status: WalletTransactionStatus.CONFIRMED, confirmedAt: now },
      );

      await this.actionAuditRepo.save(
        this.actionAuditRepo.create({
          actionType: 'CONFIRM_SUCCEEDED',
          reason,
          amountBefore: wallet.amount as any,
          amountAfter: wallet.amount as any,
          walletTransaction: { id } as any,
          performedBy: { id: adminId } as any,
        }),
      );

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CONFIRM_WALLET_SUCCEEDED',
        resourceType: 'WALLET',
        resourceId,
        description: `Wallet transaction confirmed (stub)`,
        oldValue: { status: WalletTransactionStatus.PENDING },
        newValue: {
          status: WalletTransactionStatus.CONFIRMED,
          confirmedAt: now,
        },
      });

      return {
        success: true,
        message: 'Wallet transaction confirmed (stub). Cache updated locally.',
      };
    }

    return {
      success: true,
      message: 'Wallet transaction confirmed successfully.',
    };
  }

  async adjustBalance(userId: string, amount: number, adminId: number, reason: string) {
    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'ADJUST_BALANCE_INITIATED',
      resourceType: 'WALLET',
      resourceId: userId,
      description: `Admin initiated balance adjustment: ${reason}`,
      oldValue: undefined,
      newValue: { amount, reason },
    });

    const result = await this.walletClient.adjustBalance(userId, amount, adminId, reason);

    if (!result.success) {
      throw new BadGatewayException(`Wallet core unavailable: ${result.error}`);
    }

    return {
      success: true,
      message: 'Balance adjusted successfully.',
      data: result.data,
    };
  }

  // ========== EVENT HANDLERS ==========

  async handleWalletReversed(event: { walletTransactionId: string; status: WalletTransactionStatus }) {
    // Ưu tiên externalTransactionId để đồng bộ
    await this.walletRepo.update(
      { externalTransactionId: event.walletTransactionId },
      { status: event.status },
    );
  }

  async handleWalletConfirmed(event: {
    walletTransactionId: string;
    status: WalletTransactionStatus;
    confirmedAt: Date;
  }) {
    await this.walletRepo.update(
      { externalTransactionId: event.walletTransactionId },
      { status: event.status, confirmedAt: event.confirmedAt },
    );
  }
}
