// src/modules/transactions/transactions.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction, Wallet } from '../../shared/entities';
import { WalletCacheService } from '../wallets/wallet-cache.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    private readonly walletCacheService: WalletCacheService,
  ) {}

  async getTransactions(userId: string, page = 1, limit = 20) {
    // Chuẩn hóa tham số
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

    // Check cache first
    const cached = await this.walletCacheService.getTransactionHistory(userId, pageNum);
    if (cached) {
      console.log(`🎯 CACHE HIT: Transaction history for user ${userId}, page ${pageNum}`);
      return cached;
    }

    console.log(`💾 CACHE MISS: Transaction history for user ${userId}, page ${pageNum} - Fetching from database`);

    // Lấy wallet theo userId; nếu chưa có, trả danh sách rỗng
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      return {
        data: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
      };
    }

    const [transactions, total] = await this.transactionRepo.findAndCount({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: limitNum,
      skip: (pageNum - 1) * limitNum,
    });

    const result = {
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };

    // Cache for 10 minutes (transaction history changes less frequently)
    await this.walletCacheService.setTransactionHistory(userId, pageNum, result, 600);
    console.log(`✅ Cached transaction history for user ${userId}, page ${pageNum} (TTL: 600s)`);

    return result;
  }
}
