// src/modules/transactions/transactions.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction, Wallet } from '../../shared/entities';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async getTransactions(userId: string, page = 1, limit = 20) {
    // Chuẩn hóa tham số
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 20));

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

    return {
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}
