// src/modules/withdrawals/withdrawals.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal, Wallet } from '../../shared/entities';
import { WithdrawalStatus } from '../../shared/enums';
import { CreateWithdrawalDto } from '../../shared/dtos/wallet.dto';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  async requestWithdrawal(userId: string, dto: CreateWithdrawalDto) {
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
}
