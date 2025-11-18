// src/modules/transaction-management/transaction-management.service.ts
import { Injectable, BadRequestException, NotFoundException, BadGatewayException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(TransactionManagementService.name);

  constructor(
    @InjectRepository(ManagedTransaction)
    private readonly transactionRepository: Repository<ManagedTransaction>,
    @InjectRepository(TransactionActionAudit)
    private readonly actionAuditRepository: Repository<TransactionActionAudit>,
    private readonly transactionClient: TransactionServiceClient,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ========== HELPER METHODS ==========

  /**
   * Map Transaction_Service status to frontend display format
   * Transaction_Service: PENDING, COMPLETED, FAILED, CANCELLED
   * Frontend expects: PENDING, CONFIRMED, CANCELLED
   */
  private mapTransactionStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'COMPLETED': 'CONFIRMED', // Map COMPLETED to CONFIRMED for frontend
      'FAILED': 'CANCELLED',
      'PENDING': 'PENDING',
      'CANCELLED': 'CANCELLED',
    };
    return statusMap[status] || status; // Return original if not mapped
  }

  // ========== READ-ONLY OPERATIONS (Query from Transaction_Service) ==========

  async getAllTransactions(
    page: number = 1,
    limit: number = 10,
    filters?: FilterTransactionDto,
  ): Promise<TransactionListResponseDto> {
    // Query from Transaction_Service instead of local ManagedTransaction table
    const result = await this.transactionClient.getTransactions(page, limit, {
      status: filters?.status,
      buyerId: filters?.buyerId,
      sellerId: filters?.sellerId,
      startDate: filters?.fromDate,
      endDate: filters?.toDate,
    });

    if (!result.success) {
      this.logger.error(`Failed to fetch transactions: ${result.error}`);
      // Fallback to empty result instead of throwing error
      return { data: [], total: 0, page, limit };
    }

    // Transaction_Service returns: { data: [...], total } or { items: [...], total }
    const items = result.data?.items || result.data?.data || result.data || [];
    const total = result.data?.total || 0;

    this.logger.log(`Fetched ${items.length} transactions from Transaction_Service (total: ${total})`);

    // Map Transaction_Service response to Admin_Service format
    const mappedData = items.map((tx: any) => {
      const creditsAmount = parseFloat(tx.amount || tx.creditsAmount || '0'); // kg CO2
      const totalPrice = parseFloat(tx.totalPrice || tx.totalAmount || '0'); // VND
      const pricePerKg = creditsAmount > 0 ? totalPrice / creditsAmount : 0;

      return {
        id: tx.id,
        externalTransactionId: tx.id,
        userId: tx.buyerId || tx.sellerId, // Frontend displays userId (prefer buyer)
        buyerId: tx.buyerId,
        sellerId: tx.sellerId,
        listingId: tx.listingId,
        amount: creditsAmount, // Carbon credits in kg (for frontend display)
        pricePerKg: pricePerKg, // Calculate price per kg
        totalPrice: totalPrice, // Total price in VND
        status: this.mapTransactionStatus(tx.status), // Map COMPLETED/FAILED to Admin format
        transactionType: tx.transactionType || tx.type || 'DIRECT_PURCHASE',
        description: tx.notes || tx.description || `Transaction ${tx.id}`,
        notes: tx.notes,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        confirmedAt: tx.confirmedAt || tx.updatedAt,
        cancelledAt: tx.cancelledAt,
      };
    });

    return { data: mappedData, total, page, limit };
  }

  async getTransactionById(id: string | number): Promise<TransactionResponseDto> {
    // Try to get from Transaction_Service first
    const transactionId = typeof id === 'number' ? id.toString() : id;
    const result = await this.transactionClient.getTransactionById(transactionId);
    
    if (result.success && result.data) {
      const tx = result.data;
      return {
        id: tx.id,
        externalTransactionId: tx.id,
        buyerId: tx.buyerId,
        sellerId: tx.sellerId,
        listingId: tx.listingId,
        amount: tx.totalAmount || tx.amount,
        status: tx.status,
        transactionType: tx.type || 'FIXED_PRICE',
        description: tx.description || `Transaction ${tx.id}`,
        createdAt: tx.createdAt,
        confirmedAt: tx.confirmedAt,
        cancelledAt: tx.cancelledAt,
      };
    }

    // Fallback to local cache only for numeric IDs (legacy transactions)
    if (typeof id === 'number') {
      const tx = await this.transactionRepository.findOne({ where: { id } });
      if (tx) return this.toResponseDto(tx);
    }

    throw new NotFoundException('Transaction not found');
  }

  async getTransactionActionHistory(transactionId: string | number, page: number = 1, limit: number = 10) {
    // For UUID transactions from Transaction_Service, we need to query by externalTransactionId
    // For legacy numeric IDs, query by transactionId
    const whereClause = typeof transactionId === 'string' 
      ? { transaction: { externalTransactionId: transactionId } }
      : { transactionId };

    const [data, total] = await this.actionAuditRepository.findAndCount({
      where: whereClause,
      order: { createdAt: 'DESC' as const },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  // ========== WRITE OPERATIONS (DISABLED) ==========
  // Transaction_Service does not implement admin command endpoints yet
  // Refund, Confirm, Cancel, and Resolve Dispute are not available
  // Keeping methods commented for future implementation

  /*
  async confirmTransaction(
    id: string | number,
    adminId: number,
    dto: ConfirmTransactionDto,
  ): Promise<{ success: boolean; message: string }> {
    const transactionId = typeof id === 'number' ? id.toString() : id;

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CONFIRM_TRANSACTION_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Admin initiated confirm transaction: ${dto.reason}`,
      oldValue: undefined,
      newValue: { action: 'CONFIRMING', reason: dto.reason },
    });

    const result = await this.transactionClient.confirmTransaction(
      transactionId,
      adminId,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CONFIRM_TRANSACTION_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: transactionId,
        description: `Failed to confirm transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction service unavailable: ${result.error}`);
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CONFIRM_TRANSACTION_SUCCEEDED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Transaction confirmed successfully`,
      oldValue: undefined,
      newValue: { status: 'CONFIRMED' },
    });

    return {
      success: true,
      message: 'Transaction confirmed successfully.',
    };
  }

  async cancelTransaction(
    id: string | number,
    adminId: number,
    dto: CancelTransactionDto,
  ): Promise<{ success: boolean; message: string }> {
    const transactionId = typeof id === 'number' ? id.toString() : id;

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CANCEL_TRANSACTION_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Admin initiated cancel transaction: ${dto.reason}`,
      oldValue: undefined,
      newValue: { action: 'CANCELLING', reason: dto.reason },
    });

    const result = await this.transactionClient.cancelTransaction(
      transactionId,
      adminId,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'CANCEL_TRANSACTION_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: transactionId,
        description: `Failed to cancel transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction service unavailable: ${result.error}`);
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'CANCEL_TRANSACTION_SUCCEEDED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Transaction cancelled successfully`,
      oldValue: undefined,
      newValue: { status: 'CANCELLED', reason: dto.reason },
    });

    return {
      success: true,
      message: 'Transaction cancelled successfully.',
    };
  }

  async refundTransaction(
    id: string | number,
    adminId: number,
    dto: RefundTransactionDto,
  ): Promise<{ success: boolean; message: string }> {
    const transactionId = typeof id === 'number' ? id.toString() : id;

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'REFUND_TRANSACTION_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Admin initiated refund transaction: ${dto.reason}, amount: ${dto.amount}`,
      oldValue: undefined,
      newValue: { action: 'REFUNDING', reason: dto.reason, amount: dto.amount },
    });

    const result = await this.transactionClient.refundTransaction(
      transactionId,
      adminId,
      dto.amount,
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'REFUND_TRANSACTION_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: transactionId,
        description: `Failed to refund transaction: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction service unavailable: ${result.error}`);
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'REFUND_TRANSACTION_SUCCEEDED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Transaction refunded successfully`,
      oldValue: undefined,
      newValue: { status: 'REFUNDED', amount: dto.amount },
    });

    return {
      success: true,
      message: 'Transaction refunded successfully.',
    };
  }

  async resolveDispute(
    id: string | number,
    adminId: number,
    dto: ResolveDisputeDto,
  ): Promise<{ success: boolean; message: string }> {
    const transactionId = typeof id === 'number' ? id.toString() : id;

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'RESOLVE_DISPUTE_INITIATED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Admin initiated resolve dispute: ${dto.reason}`,
      oldValue: undefined,
      newValue: { action: 'RESOLVING', resolution: dto.resolution, reason: dto.reason },
    });

    const result = await this.transactionClient.resolveDispute(
      transactionId,
      adminId,
      dto.resolution.toString(),
      dto.reason,
    );

    if (!result.success) {
      await this.auditLogService.log({
        adminUserId: adminId,
        actionName: 'RESOLVE_DISPUTE_FAILED',
        resourceType: 'TRANSACTION',
        resourceId: transactionId,
        description: `Failed to resolve dispute: ${result.error}`,
        oldValue: undefined,
        newValue: { error: result.error },
      });
      throw new BadGatewayException(`Transaction service unavailable: ${result.error}`);
    }

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'RESOLVE_DISPUTE_SUCCEEDED',
      resourceType: 'TRANSACTION',
      resourceId: transactionId,
      description: `Dispute resolved successfully`,
      oldValue: undefined,
      newValue: { resolution: dto.resolution },
    });

    return {
      success: true,
      message: 'Dispute resolved successfully.',
    };
  }
  */

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
