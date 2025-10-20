import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedTransaction } from '../../shared/entities/managed-transaction.entity';
import { TransactionActionAudit } from '../../shared/entities/transaction-action-audit.entity';
import { TransactionStatus } from '../../shared/enums/admin.enums';
import {
  FilterTransactionDto,
  ConfirmTransactionDto,
  CancelTransactionDto,
  RefundTransactionDto,
  ResolveDisputeDto,
  TransactionResponseDto,
  TransactionListResponseDto,
} from '../../shared/dtos/transaction-management.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Outbox } from '../../shared/entities/outbox.entity';

const ADMIN_ACTION_MODE = (process.env.ADMIN_ACTION_MODE ?? 'local') as 'local' | 'remote';

@Injectable()
export class TransactionManagementService {
  constructor(
    @InjectRepository(ManagedTransaction)
    private readonly transactionRepository: Repository<ManagedTransaction>,
    @InjectRepository(TransactionActionAudit)
    private readonly actionAuditRepository: Repository<TransactionActionAudit>,
    @InjectRepository(Outbox)
    private readonly outboxRepository: Repository<Outbox>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getAllTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: FilterTransactionDto,
  ): Promise<TransactionListResponseDto> {
    const f = filters ?? ({} as FilterTransactionDto);
    const query = this.transactionRepository.createQueryBuilder('tx');

    if (f.status) {
      query.where('tx.status = :status', { status: f.status });
    }

    if (f.transactionType) {
      query.andWhere('tx.transactionType = :transactionType', { transactionType: f.transactionType });
    }

    if (f.sellerId) {
      query.andWhere('tx.sellerId = :sellerId', { sellerId: f.sellerId });
    }

    if (f.buyerId) {
      query.andWhere('tx.buyerId = :buyerId', { buyerId: f.buyerId });
    }

    if (f.fromDate && f.toDate) {
      query.andWhere('tx.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: f.fromDate,
        toDate: f.toDate,
      });
    }

    const [data, total] = await query
      .orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((t) => this.toResponseDto(t)),
      total,
      page,
      limit,
    };
  }

  async getTransactionById(id: number): Promise<TransactionResponseDto> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) throw new BadRequestException('Transaction not found');
    return this.toResponseDto(tx);
  }

  async confirmTransaction(id: number, adminId: number, dto: ConfirmTransactionDto): Promise<TransactionResponseDto> {
    const reason = dto.reason;

    if (ADMIN_ACTION_MODE === 'remote') {
      await this.enqueueAdminCommand('ADMIN_CONFIRM_TRANSACTION', id, adminId, { reason });
      const current = await this.transactionRepository.findOne({ where: { id } });
      if (!current) throw new BadRequestException('Transaction not found');
      return this.toResponseDto(current);
    }

    return await this.transactionRepository.manager.transaction(async (em) => {
      const tx = await em.findOne(ManagedTransaction, { where: { id } });
      if (!tx) throw new BadRequestException('Transaction not found');
      if (tx.status !== TransactionStatus.PENDING) {
        throw new BadRequestException('Can only confirm pending transactions');
      }

      const oldStatus = tx.status;
      tx.status = TransactionStatus.COMPLETED;
      tx.completedAt = new Date();
      const updated = await em.save(tx);

      await em.save(TransactionActionAudit, {
        transactionId: id,
        actionType: 'CONFIRM',
        performedById: adminId,
        reason,
        oldStatus,
        newStatus: TransactionStatus.COMPLETED,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CONFIRM_TRANSACTION',
        resourceType: 'TRANSACTION',
        resourceId: String(id),
        description: `Confirmed transaction: ${reason}`,
        oldValue: { status: oldStatus },
        newValue: { status: TransactionStatus.COMPLETED },
      });

      await em.save(Outbox, {
        aggregateType: 'TRANSACTION',
        aggregateId: String(id),
        eventType: 'ADMIN_CONFIRMED_TRANSACTION',
        idempotencyKey: `admin-confirm-${id}-${adminId}`,
        payload: {
          transactionId: id,
          adminId,
          reason,
          oldStatus,
          newStatus: TransactionStatus.COMPLETED,
          occurredAt: new Date().toISOString(),
        },
      });

      return this.toResponseDto(updated);
    });
  }

  async cancelTransaction(id: number, adminId: number, dto: CancelTransactionDto): Promise<TransactionResponseDto> {
    const reason = dto.reason;

    if (ADMIN_ACTION_MODE === 'remote') {
      await this.enqueueAdminCommand('ADMIN_CANCEL_TRANSACTION', id, adminId, { reason });
      const current = await this.transactionRepository.findOne({ where: { id } });
      if (!current) throw new BadRequestException('Transaction not found');
      return this.toResponseDto(current);
    }

    return await this.transactionRepository.manager.transaction(async (em) => {
      const tx = await em.findOne(ManagedTransaction, { where: { id } });
      if (!tx) throw new BadRequestException('Transaction not found');
      if ([TransactionStatus.COMPLETED, TransactionStatus.CANCELLED].includes(tx.status)) {
        throw new BadRequestException('Cannot cancel completed or already cancelled transactions');
      }

      const oldStatus = tx.status;
      tx.status = TransactionStatus.CANCELLED;
      const updated = await em.save(tx);

      await em.save(TransactionActionAudit, {
        transactionId: id,
        actionType: 'CANCEL',
        performedById: adminId,
        reason,
        oldStatus,
        newStatus: TransactionStatus.CANCELLED,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CANCEL_TRANSACTION',
        resourceType: 'TRANSACTION',
        resourceId: String(id),
        description: `Cancelled transaction: ${reason}`,
        oldValue: { status: oldStatus },
        newValue: { status: TransactionStatus.CANCELLED },
      });

      await em.save(Outbox, {
        aggregateType: 'TRANSACTION',
        aggregateId: String(id),
        eventType: 'ADMIN_CANCELLED_TRANSACTION',
        idempotencyKey: `admin-cancel-${id}-${adminId}`,
        payload: {
          transactionId: id,
          adminId,
          reason,
          oldStatus,
          newStatus: TransactionStatus.CANCELLED,
          occurredAt: new Date().toISOString(),
        },
      });

      return this.toResponseDto(updated);
    });
  }

  async refundTransaction(id: number, adminId: number, dto: RefundTransactionDto): Promise<TransactionResponseDto> {
    const reason = dto.reason;

    if (ADMIN_ACTION_MODE === 'remote') {
      await this.enqueueAdminCommand('ADMIN_REFUND_TRANSACTION', id, adminId, { reason });
      const current = await this.transactionRepository.findOne({ where: { id } });
      if (!current) throw new BadRequestException('Transaction not found');
      return this.toResponseDto(current);
    }

    return await this.transactionRepository.manager.transaction(async (em) => {
      const tx = await em.findOne(ManagedTransaction, { where: { id } });
      if (!tx) throw new BadRequestException('Transaction not found');
      if (![TransactionStatus.COMPLETED, TransactionStatus.DISPUTED].includes(tx.status)) {
        throw new BadRequestException('Can only refund completed or disputed transactions');
      }

      const oldStatus = tx.status;
      tx.status = TransactionStatus.REFUNDED;
      const updated = await em.save(tx);

      await em.save(TransactionActionAudit, {
        transactionId: id,
        actionType: 'REFUND',
        performedById: adminId,
        reason,
        oldStatus,
        newStatus: TransactionStatus.REFUNDED,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'REFUND_TRANSACTION',
        resourceType: 'TRANSACTION',
        resourceId: String(id),
        description: `Refunded transaction: ${reason}`,
        oldValue: { status: oldStatus, amount: tx.amount },
        newValue: { status: TransactionStatus.REFUNDED },
      });

      await em.save(Outbox, {
        aggregateType: 'TRANSACTION',
        aggregateId: String(id),
        eventType: 'ADMIN_REFUNDED_TRANSACTION',
        idempotencyKey: `admin-refund-${id}-${adminId}`,
        payload: {
          transactionId: id,
          adminId,
          reason,
          oldStatus,
          newStatus: TransactionStatus.REFUNDED,
          occurredAt: new Date().toISOString(),
        },
      });

      return this.toResponseDto(updated);
    });
  }

  async resolveDispute(id: number, adminId: number, dto: ResolveDisputeDto): Promise<TransactionResponseDto> {
    const reason = dto.reason;
    const resolution = dto.resolution as unknown as TransactionStatus;

    if (ADMIN_ACTION_MODE === 'remote') {
      await this.enqueueAdminCommand('ADMIN_RESOLVE_DISPUTE', id, adminId, { reason, resolution });
      const current = await this.transactionRepository.findOne({ where: { id } });
      if (!current) throw new BadRequestException('Transaction not found');
      return this.toResponseDto(current);
    }

    return await this.transactionRepository.manager.transaction(async (em) => {
      const tx = await em.findOne(ManagedTransaction, { where: { id } });
      if (!tx) throw new BadRequestException('Transaction not found');
      if (tx.status !== TransactionStatus.DISPUTED) {
        throw new BadRequestException('Transaction is not disputed');
      }

      const oldStatus = tx.status;
      tx.status = resolution;
      tx.isDisputed = false;
      tx.disputeReason = null as any; // column nullable, tránh TS error
      const updated = await em.save(tx);

      await em.save(TransactionActionAudit, {
        transactionId: id,
        actionType: 'RESOLVE_DISPUTE',
        performedById: adminId,
        reason,
        oldStatus,
        newStatus: resolution,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'RESOLVE_DISPUTE',
        resourceType: 'TRANSACTION',
        resourceId: String(id),
        description: `Resolved dispute: ${reason}`,
        oldValue: { status: oldStatus, isDisputed: true },
        newValue: { status: resolution, isDisputed: false },
      });

      await em.save(Outbox, {
        aggregateType: 'TRANSACTION',
        aggregateId: String(id),
        eventType: 'ADMIN_RESOLVED_DISPUTE',
        idempotencyKey: `admin-resolve-${id}-${adminId}`,
        payload: {
          transactionId: id,
          adminId,
          reason,
          oldStatus,
          newStatus: resolution,
          occurredAt: new Date().toISOString(),
        },
      });

      return this.toResponseDto(updated);
    });
  }

  async getTransactionActionHistory(transactionId: number, page: number = 1, limit: number = 10) {
    const [data, total] = await this.actionAuditRepository.findAndCount({
      where: { transactionId }, // entity nên có cột transactionId (BIGINT)
      order: { createdAt: 'DESC' as const },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  private async enqueueAdminCommand(
    eventType: string,
    id: number,
    adminId: number,
    extra: Record<string, any>,
  ) {
    await this.outboxRepository.save({
      aggregateType: 'TRANSACTION',
      aggregateId: String(id),
      eventType,
      idempotencyKey: `${eventType}-${id}-${adminId}`,
      payload: {
        transactionId: id,
        adminId,
        ...extra,
        occurredAt: new Date().toISOString(),
      },
    });
  }

  private toResponseDto(t: ManagedTransaction): TransactionResponseDto {
    return {
      id: t.id,
      externalTransactionId: t.externalTransactionId,
      sellerId: t.sellerId,
      buyerId: t.buyerId,
      amount: t.amount,
      creditsAmount: t.creditsAmount,
      transactionType: t.transactionType,
      status: t.status,
      disputeReason: t.disputeReason,
      isDisputed: t.isDisputed,
      createdAt: t.createdAt,
      completedAt: t.completedAt,
    };
    }
}
