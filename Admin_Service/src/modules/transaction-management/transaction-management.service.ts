// src/modules/transaction-management/transaction-management.service.ts
import { Injectable, BadRequestException, NotFoundException, BadGatewayException } from '@nestjs/common';
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
import { TransactionServiceClient, TransactionCommandResult } from '../../shared/services/transaction-service-client.service';

@Injectable()
export class TransactionManagementService {
  constructor(
    @InjectRepository(ManagedTransaction)
    private readonly transactionRepository: Repository<ManagedTransaction>,
    @InjectRepository(TransactionActionAudit)
    private readonly actionAuditRepository: Repository<TransactionActionAudit>,
    private readonly transactionClient: TransactionServiceClient,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ========== READ-ONLY OPERATIONS (Query Cached Data) ==========

  async getAllTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: FilterTransactionDto,
  ): Promise<TransactionListResponseDto> {
    const f = filters ?? ({} as FilterTransactionDto);
    const query = this.transactionRepository.createQueryBuilder('tx');

    // Thu thập điều kiện an toàn (tránh andWhere khi chưa có where)
    const where: string[] = [];
    const params: Record<string, any> = {};

    if (f.status) {
      where.push('tx.status = :status');
      params.status = f.status;
    }
    if (f.transactionType) {
      where.push('tx.transactionType = :transactionType');
      params.transactionType = f.transactionType;
    }
    if (f.sellerId) {
      where.push('tx.sellerId = :sellerId');
      params.sellerId = f.sellerId;
    }
    if (f.buyerId) {
      where.push('tx.buyerId = :buyerId');
      params.buyerId = f.buyerId;
    }
    if (f.fromDate && f.toDate) {
      where.push('tx.createdAt BETWEEN :fromDate AND :toDate');
      params.fromDate = f.fromDate;
      params.toDate = f.toDate;
    } else if (f.fromDate) {
      where.push('tx.createdAt >= :fromDate');
      params.fromDate = f.fromDate;
    } else if (f.toDate) {
      where.push('tx.createdAt <= :toDate');
      params.toDate = f.toDate;
    }

    if (where.length > 0) query.where(where.join(' AND '), params);

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
    if (!tx) throw new NotFoundException('Transaction not found');
    return this.toResponseDto(tx);
  }

  async getTransactionActionHistory(transactionId: number, page: number = 1, limit: number = 10) {
    const [data, total] = await this.actionAuditRepository.findAndCount({
      where: { transactionId },
      order: { createdAt: 'DESC' as const },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ========== WRITE OPERATIONS (Send Commands to Transaction Service) ==========

  private isStubOK(result: TransactionCommandResult) {
    return !!result?.data?.stub;
  }

  async confirmTransaction(
    id: number,
    adminId: number,
    dto: ConfirmTransactionDto,
  ): Promise<{ success: boolean; message: string }> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Can only confirm pending transactions');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CONFIRM_TRANSACTION_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: tx.externalTransactionId,
      description: `Admin initiated confirm transaction: ${dto.reason}`,
      oldValue: { status: tx.status },
      newValue: { action: 'CONFIRMING', reason: dto.reason },
    });

    await this.actionAuditRepository.save({
      transactionId: id,
      actionType: 'CONFIRM_INITIATED',
      performedById: adminId, // đảm bảo entity dùng đúng tên cột (performed_by)
      reason: dto.reason,
      oldStatus: tx.status,
      newStatus: TransactionStatus.PENDING,
    });

    const result = await this.transactionClient.confirmTransaction(
      tx.externalTransactionId, // dùng externalId
      adminId,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CONFIRM_TRANSACTION_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Failed to confirm transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      // Downstream lỗi => 502
      throw new BadGatewayException(`Transaction core unavailable: ${result.error}`);
    }

    // Nếu đang stub, cập nhật cache local ngay (không đợi event)
    if (this.isStubOK(result)) {
      await this.transactionRepository.update(
        { id },
        { status: TransactionStatus.COMPLETED, completedAt: new Date() },
      );

      await this.actionAuditRepository.save({
        transactionId: id,
        actionType: 'CONFIRM_SUCCEEDED',
        performedById: adminId,
        reason: dto.reason,
        oldStatus: TransactionStatus.PENDING,
        newStatus: TransactionStatus.COMPLETED,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CONFIRM_TRANSACTION_SUCCEEDED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Transaction confirmed (stub)`,
        oldValue: { status: TransactionStatus.PENDING },
        newValue: { status: TransactionStatus.COMPLETED },
      });
    }

    return {
      success: true,
      message: this.isStubOK(result)
        ? 'Transaction confirmed (stub). Cache updated locally.'
        : 'Transaction confirmed. Cache will be updated shortly.',
    };
  }

  async cancelTransaction(
    id: number,
    adminId: number,
    dto: CancelTransactionDto,
  ): Promise<{ success: boolean; message: string }> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');

    if ([TransactionStatus.COMPLETED, TransactionStatus.CANCELLED].includes(tx.status)) {
      throw new BadRequestException('Cannot cancel completed or already cancelled transactions');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CANCEL_TRANSACTION_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: tx.externalTransactionId,
      description: `Admin initiated cancel transaction: ${dto.reason}`,
      oldValue: { status: tx.status },
      newValue: { action: 'CANCELLING', reason: dto.reason },
    });

    await this.actionAuditRepository.save({
      transactionId: id,
      actionType: 'CANCEL_INITIATED',
      performedById: adminId,
      reason: dto.reason,
      oldStatus: tx.status,
      newStatus: tx.status,
    });

    const result = await this.transactionClient.cancelTransaction(
      tx.externalTransactionId,
      adminId,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CANCEL_TRANSACTION_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Failed to cancel transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction core unavailable: ${result.error}`);
    }

    if (this.isStubOK(result)) {
      await this.transactionRepository.update(
        { id },
        { status: TransactionStatus.CANCELLED },
      );

      await this.actionAuditRepository.save({
        transactionId: id,
        actionType: 'CANCEL_SUCCEEDED',
        performedById: adminId,
        reason: dto.reason,
        oldStatus: tx.status,
        newStatus: TransactionStatus.CANCELLED,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CANCEL_TRANSACTION_SUCCEEDED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Transaction cancelled (stub)`,
        oldValue: { status: tx.status },
        newValue: { status: TransactionStatus.CANCELLED },
      });
    }

    return {
      success: true,
      message: this.isStubOK(result)
        ? 'Transaction cancelled (stub). Cache updated locally.'
        : 'Transaction cancelled. Cache will be updated shortly.',
    };
  }

  async refundTransaction(
    id: number,
    adminId: number,
    dto: RefundTransactionDto,
  ): Promise<{ success: boolean; message: string }> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');

    if (![TransactionStatus.COMPLETED, TransactionStatus.DISPUTED].includes(tx.status)) {
      throw new BadRequestException('Can only refund completed or disputed transactions');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'REFUND_TRANSACTION_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: tx.externalTransactionId,
      description: `Admin initiated refund transaction: ${dto.reason}`,
      oldValue: { status: tx.status, amount: tx.amount },
      newValue: { action: 'REFUNDING', reason: dto.reason },
    });

    await this.actionAuditRepository.save({
      transactionId: id,
      actionType: 'REFUND_INITIATED',
      performedById: adminId,
      reason: dto.reason,
      oldStatus: tx.status,
      newStatus: tx.status,
    });

    const result = await this.transactionClient.refundTransaction(
      tx.externalTransactionId,
      adminId,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'REFUND_TRANSACTION_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Failed to refund transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction core unavailable: ${result.error}`);
    }

    if (this.isStubOK(result)) {
      // NOTE: nếu enum của bạn có REFUNDED, dùng REFUNDED. Nếu không, hãy tạo.
      const next = (TransactionStatus as any).REFUNDED ?? TransactionStatus.COMPLETED;
      await this.transactionRepository.update({ id }, { status: next });

      await this.actionAuditRepository.save({
        transactionId: id,
        actionType: 'REFUND_SUCCEEDED',
        performedById: adminId,
        reason: dto.reason,
        oldStatus: tx.status,
        newStatus: next,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'REFUND_TRANSACTION_SUCCEEDED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Transaction refunded (stub)`,
        oldValue: { status: tx.status },
        newValue: { status: next },
      });
    }

    return {
      success: true,
      message: this.isStubOK(result)
        ? 'Transaction refunded (stub). Cache updated locally.'
        : 'Transaction refunded. Cache will be updated shortly.',
    };
  }

  async resolveDispute(
    id: number,
    adminId: number,
    dto: ResolveDisputeDto,
  ): Promise<{ success: boolean; message: string }> {
    const tx = await this.transactionRepository.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');

    if (tx.status !== TransactionStatus.DISPUTED) {
      throw new BadRequestException('Transaction is not disputed');
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'RESOLVE_DISPUTE_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: tx.externalTransactionId,
      description: `Admin resolved dispute: ${dto.reason}`,
      oldValue: { status: tx.status, isDisputed: true },
      newValue: { resolution: dto.resolution, reason: dto.reason },
    });

    await this.actionAuditRepository.save({
      transactionId: id,
      actionType: 'RESOLVE_DISPUTE_INITIATED',
      performedById: adminId,
      reason: dto.reason,
      oldStatus: tx.status,
      newStatus: tx.status,
    });

    const result = await this.transactionClient.resolveDispute(
      tx.externalTransactionId,
      adminId,
      dto.resolution,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'RESOLVE_DISPUTE_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Failed to resolve dispute: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction core unavailable: ${result.error}`);
    }

    if (this.isStubOK(result)) {
      // Map resolution -> status (tuỳ case)
      let next: TransactionStatus = TransactionStatus.COMPLETED;
      const res = (dto.resolution || '').toUpperCase();
      if (res === 'REFUND') next = (TransactionStatus as any).REFUNDED ?? TransactionStatus.COMPLETED;
      if (res === 'CANCEL') next = TransactionStatus.CANCELLED;

      await this.transactionRepository.update(
        { id },
        { status: next, isDisputed: false, disputeReason: null },
      );

      await this.actionAuditRepository.save({
        transactionId: id,
        actionType: 'RESOLVE_DISPUTE_SUCCEEDED',
        performedById: adminId,
        reason: dto.reason,
        oldStatus: TransactionStatus.DISPUTED,
        newStatus: next,
      });

      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'RESOLVE_DISPUTE_SUCCEEDED',
        resourceType: 'TRANSACTION',
        resourceId: tx.externalTransactionId,
        description: `Dispute resolved (stub) with resolution=${dto.resolution}`,
        oldValue: { status: TransactionStatus.DISPUTED, isDisputed: true },
        newValue: { status: next, isDisputed: false },
      });
    }

    return {
      success: true,
      message: this.isStubOK(result)
        ? 'Dispute resolved (stub). Cache updated locally.'
        : 'Dispute resolved. Cache will be updated shortly.',
    };
  }

  // ========== EVENT HANDLERS (Update Cache from Transaction Service Events) ==========

  async handleTransactionConfirmed(event: {
    transactionId: string;
    status: TransactionStatus;
    completedAt: Date;
  }) {
    await this.transactionRepository.update(
      { externalTransactionId: event.transactionId },
      {
        status: event.status,
        completedAt: event.completedAt,
      },
    );
  }

  async handleTransactionCancelled(event: {
    transactionId: string;
    status: TransactionStatus;
  }) {
    await this.transactionRepository.update(
      { externalTransactionId: event.transactionId },
      { status: event.status },
    );
  }

  async handleTransactionRefunded(event: {
    transactionId: string;
    status: TransactionStatus;
  }) {
    await this.transactionRepository.update(
      { externalTransactionId: event.transactionId },
      { status: event.status },
    );
  }

  async handleDisputeResolved(event: {
    transactionId: string;
    status: TransactionStatus;
  }) {
    await this.transactionRepository.update(
      { externalTransactionId: event.transactionId },
      {
        status: event.status,
        isDisputed: false,
        disputeReason: null as any,
      },
    );
  }

  // ========== HELPER ==========

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
