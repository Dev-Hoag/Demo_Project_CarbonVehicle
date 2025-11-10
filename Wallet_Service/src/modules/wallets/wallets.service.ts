// src/modules/wallets/wallets.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, WalletTransaction } from '../../shared/entities';
import { WalletAuditLog } from '../../shared/entities/wallet-audit.entity';
import { WalletStatus, TransactionType, TransactionStatus } from '../../shared/enums';
import { CreateDepositDto } from '../../shared/dtos/wallet.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { randomUUID } from 'crypto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
  private readonly transactionRepo: Repository<WalletTransaction>,
  @InjectRepository(WalletAuditLog)
  private readonly auditRepo: Repository<WalletAuditLog>,
    private readonly amqp: AmqpConnection,
  ) {}

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    
    if (!wallet) {
      wallet = this.walletRepo.create({
        userId,
        balance: 0,
        lockedBalance: 0,
        currency: 'VND',
        status: WalletStatus.ACTIVE,
      });
      await this.walletRepo.save(wallet);
    }

    return wallet;
  }

  async getWalletSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);
    
    // Get transaction stats
    const deposits = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.walletId = :walletId', { walletId: wallet.id })
      .andWhere('t.type = :type', { type: TransactionType.DEPOSIT })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    const withdrawals = await this.transactionRepo
      .createQueryBuilder('t')
      .select('SUM(t.amount)', 'total')
      .where('t.walletId = :walletId', { walletId: wallet.id })
      .andWhere('t.type = :type', { type: TransactionType.WITHDRAWAL })
      .andWhere('t.status = :status', { status: TransactionStatus.COMPLETED })
      .getRawOne();

    return {
      wallet,
      summary: {
        totalDeposited: Number(deposits.total) || 0,
        totalWithdrawn: Number(withdrawals.total) || 0,
        availableBalance: wallet.availableBalance,
        lockedBalance: Number(wallet.lockedBalance),
      },
    };
  }

  async initiateDeposit(userId: string, dto: CreateDepositDto) {
    const wallet = await this.getOrCreateWallet(userId);
    // Tạo paymentRequestId để làm correlation với Payment_Service
    const paymentRequestId = randomUUID();
    const idempotencyKey = `deposit:${userId}:${dto.amount}:${paymentRequestId}`;

    // Phát event yêu cầu thanh toán (event-driven). Payment_Service sẽ xử lý và sau đó phát payment.completed
    await this.amqp.publish('ccm.events', 'payment.requested', {
      userId,
      amount: dto.amount,
      paymentRequestId,
      paymentMethod: dto.paymentMethod || 'UNKNOWN',
      returnUrl: dto.returnUrl || null,
      idempotencyKey,
      reason: 'Deposit initiated',
      timestamp: new Date().toISOString(),
    });

    // Trả về thông tin để client tiếp tục thanh toán (tùy Payment_Service cung cấp URL hoặc QR sau)
    return {
      message: 'Deposit requested. Continue with Payment Service to complete.',
      wallet,
      amount: dto.amount,
      paymentRequestId,
      // paymentUrl sẽ do Payment_Service cung cấp ở luồng khác (webhook/event hoặc query tiếp theo)
    };
  }

  async addBalance(userId: string, amount: number, referenceId: string, description: string) {
    const wallet = await this.getOrCreateWallet(userId);

    // Idempotency: avoid duplicate deposit entries for the same payment reference
    const existing = await this.transactionRepo.findOne({
      where: {
        walletId: wallet.id,
        referenceType: 'payment',
        referenceId,
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
      },
    });
    if (existing) {
      return { wallet, transaction: existing };
    }

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: Number(wallet.balance) + amount,
      status: TransactionStatus.COMPLETED,
      referenceType: 'payment',
      referenceId,
      description,
    });

    wallet.balance = Number(wallet.balance) + amount;
    await this.walletRepo.save(wallet);
    await this.transactionRepo.save(transaction);
    await this.auditRepo.save(this.auditRepo.create({
      walletId: wallet.id,
      userId: wallet.userId,
      delta: amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      sourceType: 'deposit',
      sourceId: referenceId,
      transactionId: transaction.id,
      description,
    }));
    return { wallet, transaction };
  }

  async deductBalance(userId: string, amount: number, referenceId: string, description: string) {
    const wallet = await this.getOrCreateWallet(userId);

    if (wallet.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: Number(wallet.balance) - amount,
      status: TransactionStatus.COMPLETED,
      referenceType: 'withdrawal',
      referenceId,
      description,
    });

    wallet.balance = Number(wallet.balance) - amount;
    await this.walletRepo.save(wallet);
    await this.transactionRepo.save(transaction);
    await this.auditRepo.save(this.auditRepo.create({
      walletId: wallet.id,
      userId: wallet.userId,
      delta: -amount,
      balanceBefore: transaction.balanceBefore,
      balanceAfter: transaction.balanceAfter,
      sourceType: 'withdrawal',
      sourceId: referenceId,
      transactionId: transaction.id,
      description,
    }));
    return { wallet, transaction };
  }
}
