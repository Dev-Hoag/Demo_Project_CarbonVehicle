// src/modules/withdrawals/withdrawals.service.ts

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Withdrawal, Wallet, WalletTransaction } from '../../shared/entities';
import { WithdrawalStatus, TransactionType, TransactionStatus } from '../../shared/enums';
import { CreateWithdrawalDto } from '../../shared/dtos/wallet.dto';

@Injectable()
export class WithdrawalsService {
  private readonly logger = new Logger(WithdrawalsService.name);
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
  ) {}

  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto) {
    // Verify password first
    this.logger.log(`Verifying password for user ${userId}`);
    this.logger.debug(`Password received: ${dto.password ? '***' + dto.password.slice(-4) : 'MISSING'}`);

    await this.verifyUserPassword(userId, dto.password);

    this.logger.log(`Password verified successfully for user ${userId}`);

    const wallet = await this.walletRepo.findOne({ where: { userId } });
    
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (wallet.availableBalance < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const minAmount = 50000;
    const maxAmount = 50000000;

    if (dto.amount < minAmount || dto.amount > maxAmount) {
      throw new BadRequestException(
        `Withdrawal amount must be between ${minAmount} and ${maxAmount}`,
      );
    }

    const fee = dto.amount * 0.005; // 0.5% fee
    const netAmount = dto.amount - fee;

    const withdrawal = this.withdrawalRepo.create({
      userId,
      walletId: wallet.id,
      amount: dto.amount,
      fee,
      netAmount,
      bankAccountName: dto.bankAccountName,
      bankAccountNumber: dto.bankAccountNumber,
      bankName: dto.bankName,
      bankBranch: dto.bankBranch,
      status: WithdrawalStatus.PENDING,
      notes: dto.notes,
    });

    await this.withdrawalRepo.save(withdrawal);

    return {
      message: 'Withdrawal request submitted. Please wait for approval.',
      withdrawal,
    };
  }

  async getWithdrawals(userId: string) {
    const withdrawals = await this.withdrawalRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return withdrawals;
  }

  private async verifyUserPassword(userId: string, password: string): Promise<void> {
    this.logger.debug(`verifyUserPassword called with userId=${userId}, pwd=${password ? '***' + password.slice(-4) : 'MISSING'}`);

    try {
      const userServiceUrl = process.env.USER_SERVICE_URL || 'http://user_service_app:3001';
      this.logger.debug(`Calling User Service at ${userServiceUrl}/api/auth/verify-password`);

      const response = await axios.post(
        `${userServiceUrl}/api/auth/verify-password`,
        {
          userId: parseInt(userId as any, 10),
          password,
        },
        {
          headers: {
            'x-internal-api-key': process.env.INTERNAL_API_KEY || 'ccm-internal-secret-2024',
          },
          timeout: 5000,
        },
      );

      this.logger.debug(`User Service response: ${JSON.stringify(response.data)}`);

      if (!response.data?.valid) {
        this.logger.warn(`Password invalid for user ${userId}`);
        throw new BadRequestException('Invalid password');
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;
      this.logger.error(`verifyUserPassword error (status=${status}): ${JSON.stringify(data) || error.message}`);

      if (status === 401 || error.message === 'Invalid password') {
        throw new BadRequestException('Invalid password. Please try again.');
      }
      throw new BadRequestException('Failed to verify password. Please try again.');
    }
  }

  // ==================== ADMIN METHODS ====================

  /**
   * Get all pending withdrawals for admin review
   */
  async getPendingWithdrawals() {
    const withdrawals = await this.withdrawalRepo.find({
      where: { status: WithdrawalStatus.PENDING },
      order: { createdAt: 'ASC' },
    });

    return withdrawals;
  }

  /**
   * Get all withdrawals (for admin)
   */
  async getAllWithdrawals(status?: WithdrawalStatus) {
    const where = status ? { status } : {};
    const withdrawals = await this.withdrawalRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return withdrawals;
  }

  /**
   * Approve withdrawal - deduct balance and create transaction
   */
  async approveWithdrawal(withdrawalId: string, adminId: string) {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not in pending status');
    }

    const wallet = await this.walletRepo.findOne({
      where: { id: withdrawal.walletId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Check balance again
    const currentBalance = Number(wallet.balance) || 0;
    if (currentBalance < withdrawal.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Calculate new balance
    const newBalance = currentBalance - withdrawal.amount;

    // Create withdrawal transaction
    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.WITHDRAWAL,
      amount: withdrawal.amount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'withdrawal',
      referenceId: withdrawal.id,
      description: `Withdrawal to ${withdrawal.bankName} - ${withdrawal.bankAccountNumber}`,
    });

    // Update wallet balance
    wallet.balance = newBalance as any;

    // Update withdrawal status
    withdrawal.status = WithdrawalStatus.APPROVED;
    withdrawal.approvedBy = adminId;
    withdrawal.approvedAt = new Date();
    withdrawal.processedAt = new Date();

    // Save transaction first to get the ID
    const savedTransaction = await this.transactionRepo.save(transaction);
    
    // Link transaction to withdrawal
    withdrawal.transactionId = savedTransaction.id;

    // Save all changes
    await this.walletRepo.save(wallet);
    await this.withdrawalRepo.save(withdrawal);

    return {
      message: 'Withdrawal approved and processed successfully',
      withdrawal,
      transaction,
      newBalance,
    };
  }

  /**
   * Reject withdrawal
   */
  async rejectWithdrawal(withdrawalId: string, adminId: string, reason: string) {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawal.status !== WithdrawalStatus.PENDING) {
      throw new BadRequestException('Withdrawal is not in pending status');
    }

    withdrawal.status = WithdrawalStatus.REJECTED;
    withdrawal.rejectionReason = reason;
    withdrawal.approvedBy = adminId;
    withdrawal.processedAt = new Date();

    await this.withdrawalRepo.save(withdrawal);

    return {
      message: 'Withdrawal rejected',
      withdrawal,
    };
  }
}
