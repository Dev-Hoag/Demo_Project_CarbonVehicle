// src/modules/wallets/wallets.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import axios from 'axios';
import { Wallet, WalletTransaction } from '../../shared/entities';
import { WalletAuditLog } from '../../shared/entities/wallet-audit.entity';
import { WalletStatus, TransactionType, TransactionStatus } from '../../shared/enums';
import { CreateDepositDto, TransferFundsDto } from '../../shared/dtos/wallet.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { randomUUID } from 'crypto';
import { WalletCacheService } from './wallet-cache.service';

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
    private readonly dataSource: DataSource,
    private readonly walletCacheService: WalletCacheService,
  ) {}

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    // Check cache first
    const cached = await this.walletCacheService.getWalletBalance(userId);
    if (cached) {
      console.log(`🎯 CACHE HIT: Wallet balance for user ${userId}`);
      return cached;
    }

    console.log(`💾 CACHE MISS: Wallet balance for user ${userId} - Fetching from database`);
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

    // Cache the wallet for 5 minutes
    await this.walletCacheService.setWalletBalance(userId, wallet, 300);
    console.log(`✅ Cached wallet balance for user ${userId} (TTL: 300s)`);

    return wallet;
  }

  async getWalletSummary(userId: string) {
    // Check cache first
    const cached = await this.walletCacheService.getWalletSummary(userId);
    if (cached) {
      console.log(`🎯 CACHE HIT: Wallet summary for user ${userId}`);
      return cached;
    }

    console.log(`💾 CACHE MISS: Wallet summary for user ${userId} - Fetching from database`);
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

    const result = {
      wallet,
      summary: {
        totalDeposited: Number(deposits.total) || 0,
        totalWithdrawn: Number(withdrawals.total) || 0,
        availableBalance: wallet.availableBalance,
        lockedBalance: Number(wallet.lockedBalance),
      },
    };

    // Cache the summary for 5 minutes
    await this.walletCacheService.setWalletSummary(userId, result, 300);
    console.log(`✅ Cached wallet summary for user ${userId} (TTL: 300s)`);

    return result;
  }

  async initiateDeposit(userId: string, dto: CreateDepositDto) {
    const wallet = await this.getOrCreateWallet(userId);
    // Tạo paymentRequestId để làm correlation với Payment_Service
    const paymentRequestId = randomUUID();
    const idempotencyKey = `deposit:${userId}:${dto.amount}:${paymentRequestId}`;

    try {
      // Gọi Payment_Service API để tạo payment
      const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment_service:3002';
      const paymentResponse = await axios.post(`${paymentServiceUrl}/api/payments/initiate`, {
        transactionId: paymentRequestId, // Use paymentRequestId as transactionId
        userId: parseInt(userId), // Convert to number
        gateway: (dto.paymentMethod || 'VNPAY').toUpperCase(),
        amount: dto.amount,
        orderInfo: `Deposit ${dto.amount} VND for user ${userId}`,
        returnUrl: dto.returnUrl || 'http://localhost:3008/api/wallets/deposit/callback',
      }, {
        headers: {
          'x-internal-api-key': process.env.INTERNAL_API_KEY || 'ccm-internal-secret-2024',
          'Content-Type': 'application/json',
        },
      });

      // Phát event yêu cầu thanh toán (event-driven). Payment_Service sẽ xử lý và sau đó phát payment.completed
      await this.amqp.publish('ccm.events', 'payment.requested', {
        userId,
        amount: dto.amount,
        paymentRequestId,
        paymentCode: paymentResponse.data.paymentCode,
        paymentMethod: dto.paymentMethod || 'VNPAY',
        returnUrl: dto.returnUrl || null,
        idempotencyKey,
        reason: 'Deposit initiated',
        timestamp: new Date().toISOString(),
      });

      // Trả về thông tin để client tiếp tục thanh toán
      return {
        message: 'Deposit initiated successfully. Complete payment to add funds to wallet.',
        wallet,
        amount: dto.amount,
        paymentRequestId,
        paymentCode: paymentResponse.data.paymentCode,
        paymentUrl: paymentResponse.data.paymentUrl,
        qrCode: paymentResponse.data.qrCode,
      };
    } catch (error) {
      throw new Error(`Failed to initiate deposit: ${error.response?.data?.message || error.message}`);
    }
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

    // Ensure balance is a number (TypeORM decimal can return string)
    const currentBalance = Number(wallet.balance) || 0;
    const newBalance = currentBalance + Number(amount);

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.DEPOSIT,
      amount: Number(amount),
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'payment',
      referenceId,
      description,
    });

    wallet.balance = newBalance as any; // Cast to avoid type error
    await this.walletRepo.save(wallet);
    await this.transactionRepo.save(transaction);
    await this.auditRepo.save(this.auditRepo.create({
      walletId: wallet.id,
      userId: wallet.userId,
      delta: Number(amount),
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      sourceType: 'deposit',
      sourceId: referenceId,
      transactionId: transaction.id,
      description,
    }));

    // Invalidate cache after deposit
    await this.walletCacheService.invalidateAllForUser(userId);
    console.log(`🗑️ Cache invalidated after deposit for user ${userId}`);
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

    // Invalidate cache after withdrawal
    await this.walletCacheService.invalidateAllForUser(userId);
    console.log(`🗑️ Cache invalidated after withdrawal for user ${userId}`);

    return { wallet, transaction };
  }

  private async verifyUserPassword(userId: string, password: string): Promise<void> {
    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user_service_app:3001';
      const response = await axios.post(`${userServiceUrl}/api/auth/verify-password`, {
        userId: parseInt(userId),
        password,
      }, {
        headers: {
          'x-internal-api-key': process.env.INTERNAL_API_KEY || 'ccm-internal-secret-2024',
        },
      });

      if (!response.data.valid) {
        throw new Error('Invalid password');
      }
    } catch (error) {
      if (error.response?.status === 401 || error.message === 'Invalid password') {
        throw new Error('Invalid password. Please try again.');
      }
      throw new Error('Failed to verify password. Please try again.');
    }
  }

  async transferFunds(fromUserId: string, dto: TransferFundsDto) {
    // Verify password first
    await this.verifyUserPassword(fromUserId, dto.password);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Get sender wallet
      const senderWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderWallet) {
        throw new NotFoundException('Sender wallet not found');
      }

      // Check sender balance
      const senderBalance = Number(senderWallet.balance) || 0;
      if (senderBalance < dto.amount) {
        throw new Error('Insufficient balance');
      }

      // Get or create recipient wallet
      let recipientWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: dto.toUserId.toString() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!recipientWallet) {
        // Create recipient wallet if not exists
        recipientWallet = queryRunner.manager.create(Wallet, {
          userId: dto.toUserId.toString(),
          balance: 0,
          lockedBalance: 0,
          currency: 'VND',
          status: WalletStatus.ACTIVE,
        });
        await queryRunner.manager.save(recipientWallet);
      }

      const recipientBalance = Number(recipientWallet.balance) || 0;
      const transferId = randomUUID();

      // Deduct from sender
      const senderNewBalance = senderBalance - dto.amount;
      senderWallet.balance = senderNewBalance as any;
      await queryRunner.manager.save(senderWallet);

      // Create sender transaction
      const senderTransaction = queryRunner.manager.create(WalletTransaction, {
        walletId: senderWallet.id,
        type: TransactionType.TRANSFER,
        amount: dto.amount,
        balanceBefore: senderBalance,
        balanceAfter: senderNewBalance,
        status: TransactionStatus.COMPLETED,
        referenceType: 'transfer',
        referenceId: transferId,
        description: dto.description || `Transfer to user ${dto.toUserId}`,
      });
      await queryRunner.manager.save(senderTransaction);

      // Add to recipient
      const recipientNewBalance = recipientBalance + dto.amount;
      recipientWallet.balance = recipientNewBalance as any;
      await queryRunner.manager.save(recipientWallet);

      // Create recipient transaction
      const recipientTransaction = queryRunner.manager.create(WalletTransaction, {
        walletId: recipientWallet.id,
        type: TransactionType.DEPOSIT,
        amount: dto.amount,
        balanceBefore: recipientBalance,
        balanceAfter: recipientNewBalance,
        status: TransactionStatus.COMPLETED,
        referenceType: 'transfer',
        referenceId: transferId,
        description: dto.description || `Transfer from user ${fromUserId}`,
      });
      await queryRunner.manager.save(recipientTransaction);

      // Create audit logs
      await queryRunner.manager.save(WalletAuditLog, {
        walletId: senderWallet.id,
        userId: senderWallet.userId,
        delta: -dto.amount,
        balanceBefore: senderBalance,
        balanceAfter: senderNewBalance,
        sourceType: 'transfer',
        sourceId: transferId,
        transactionId: senderTransaction.id,
        description: `Transfer to user ${dto.toUserId}`,
      });

      await queryRunner.manager.save(WalletAuditLog, {
        walletId: recipientWallet.id,
        userId: recipientWallet.userId,
        delta: dto.amount,
        balanceBefore: recipientBalance,
        balanceAfter: recipientNewBalance,
        sourceType: 'transfer',
        sourceId: transferId,
        transactionId: recipientTransaction.id,
        description: `Transfer from user ${fromUserId}`,
      });

      await queryRunner.commitTransaction();

      // Invalidate cache for both sender and recipient
      await this.walletCacheService.invalidateAllForUser(fromUserId);
      await this.walletCacheService.invalidateAllForUser(dto.toUserId.toString());
      console.log(`🗑️ Cache invalidated after transfer for users ${fromUserId} and ${dto.toUserId}`);

      // Publish transfer event
      await this.amqp.publish('ccm.events', 'transfer.completed', {
        transferId,
        fromUserId,
        toUserId: dto.toUserId,
        amount: dto.amount,
        description: dto.description,
        timestamp: new Date().toISOString(),
      });

      return {
        message: 'Transfer completed successfully',
        transferId,
        senderTransaction,
        recipientTransaction,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
