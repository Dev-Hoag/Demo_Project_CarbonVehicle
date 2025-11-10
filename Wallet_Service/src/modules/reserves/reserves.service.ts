// src/modules/reserves/reserves.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserve, Wallet, WalletTransaction } from '../../shared/entities';
import { ReserveStatus, TransactionType, TransactionStatus, WalletStatus } from '../../shared/enums';

@Injectable()
export class ReservesService {
  constructor(
    @InjectRepository(Reserve)
    private readonly reserveRepo: Repository<Reserve>,
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepo: Repository<WalletTransaction>,
  ) {}

  async reserveFunds(
    userId: string,
    transactionId: string,
    amount: number,
    expirationMinutes = 30,
  ) {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    if (wallet.availableBalance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create reserve
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

    const reserve = this.reserveRepo.create({
      walletId: wallet.id,
      transactionId,
      amount,
      status: ReserveStatus.ACTIVE,
      expiresAt,
    });

    // Lock funds
    wallet.lockedBalance = Number(wallet.lockedBalance) + amount;

    // Create transaction record
    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.RESERVE,
      amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'reserve',
      referenceId: transactionId,
      description: `Funds reserved for transaction ${transactionId}`,
    });

    await this.reserveRepo.save(reserve);
    await this.walletRepo.save(wallet);
    await this.transactionRepo.save(transaction);

    return { reserve, wallet };
  }

  async releaseFunds(transactionId: string) {
    const reserve = await this.reserveRepo.findOne({
      where: { transactionId, status: ReserveStatus.ACTIVE },
    });

    if (!reserve) {
      throw new BadRequestException('Reserve not found or already processed');
    }

    const wallet = await this.walletRepo.findOne({ where: { id: reserve.walletId } });

    // Unlock funds
    wallet.lockedBalance = Number(wallet.lockedBalance) - Number(reserve.amount);
    reserve.status = ReserveStatus.RELEASED;
    reserve.releasedAt = new Date();

    // Create transaction record
    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      type: TransactionType.RELEASE,
      amount: reserve.amount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'reserve',
      referenceId: transactionId,
      description: `Funds released from transaction ${transactionId}`,
    });

    await this.reserveRepo.save(reserve);
    await this.walletRepo.save(wallet);
    await this.transactionRepo.save(transaction);

    return { reserve, wallet };
  }

  async settleFunds(
    transactionId: string,
    buyerId: string,
    sellerId: string,
    amount: number,
  ) {
    // Release buyer's reserved funds and deduct
    const buyerReserve = await this.reserveRepo.findOne({
      where: { transactionId, status: ReserveStatus.ACTIVE },
    });

    if (!buyerReserve) {
      throw new BadRequestException('Buyer reserve not found');
    }

    const buyerWallet = await this.walletRepo.findOne({ where: { id: buyerReserve.walletId } });
    
    if (!buyerWallet) {
      throw new BadRequestException('Buyer wallet not found');
    }

    // Check if buyer has enough locked funds
    if (Number(buyerWallet.lockedBalance) < amount) {
      throw new BadRequestException('Insufficient locked funds');
    }

    // Get or create seller wallet
    let sellerWallet = await this.walletRepo.findOne({ where: { userId: sellerId } });
    if (!sellerWallet) {
      sellerWallet = this.walletRepo.create({
        userId: sellerId,
        balance: 0,
        lockedBalance: 0,
        currency: 'VND',
        status: WalletStatus.ACTIVE,
      });
      await this.walletRepo.save(sellerWallet);
    }

    // Deduct from buyer (unlock + deduct)
    buyerWallet.lockedBalance = Number(buyerWallet.lockedBalance) - amount;
    buyerWallet.balance = Number(buyerWallet.balance) - amount;

    // Add to seller
    sellerWallet.balance = Number(sellerWallet.balance) + amount;

    // Update reserve status
    buyerReserve.status = ReserveStatus.SETTLED;
    buyerReserve.settledAt = new Date();

    // Create transaction records
    const buyerTransaction = this.transactionRepo.create({
      walletId: buyerWallet.id,
      type: TransactionType.SETTLE_OUT,
      amount: -amount,
      balanceBefore: Number(buyerWallet.balance) + amount,
      balanceAfter: buyerWallet.balance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'transaction',
      referenceId: transactionId,
      description: `Payment settled for transaction ${transactionId}`,
    });

    const sellerTransaction = this.transactionRepo.create({
      walletId: sellerWallet.id,
      type: TransactionType.SETTLE_IN,
      amount: amount,
      balanceBefore: Number(sellerWallet.balance) - amount,
      balanceAfter: sellerWallet.balance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'transaction',
      referenceId: transactionId,
      description: `Payment received from transaction ${transactionId}`,
    });

    await this.reserveRepo.save(buyerReserve);
    await this.walletRepo.save(buyerWallet);
    await this.walletRepo.save(sellerWallet);
    await this.transactionRepo.save(buyerTransaction);
    await this.transactionRepo.save(sellerTransaction);

    return { buyerWallet, sellerWallet, reserve: buyerReserve };
  }
}
