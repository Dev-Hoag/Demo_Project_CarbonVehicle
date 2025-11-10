// src/modules/wallets/wallets.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet, WalletTransaction } from '../../shared/entities';
import { WalletStatus, TransactionType, TransactionStatus } from '../../shared/enums';
import { CreateDepositDto } from '../../shared/dtos/wallet.dto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
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

    // TODO: Call Payment Service to create payment
    // For now, return mock response
    return {
      message: 'Deposit initiated. Please complete payment via Payment Service.',
      wallet,
      amount: dto.amount,
      paymentUrl: 'https://payment-gateway.example.com/pay/mock-payment-id',
    };
  }

  async addBalance(userId: string, amount: number, referenceId: string, description: string) {
    const wallet = await this.getOrCreateWallet(userId);

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

    return { wallet, transaction };
  }
}
