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
  
  async getMetrics() {
    // Tổng locked từ bảng wallets
    const lockedRow = await this.walletRepo
      .createQueryBuilder('w')
      .select('COALESCE(SUM(w.locked_balance), 0)', 'locked')
      .getRawOne<{ locked: string }>();

    // Tổng reserves ACTIVE
    const activeRow = await this.reserveRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.amount), 0)', 'active')
      .where('r.status = :status', { status: ReserveStatus.ACTIVE })
      .getRawOne<{ active: string }>();

    // Reserves sẽ hết hạn trong 15 phút
    const in15 = new Date(Date.now() + 15 * 60 * 1000);
    const expiringCount = await this.reserveRepo
      .createQueryBuilder('r')
      .where('r.status = :status', { status: ReserveStatus.ACTIVE })
      .andWhere('r.expires_at <= :in15', { in15 })
      .getCount();

    const locked = Number(lockedRow?.locked || 0);
    const active = Number(activeRow?.active || 0);
    const drift = Math.abs(locked - active);

    return {
      lockedBalanceTotal: locked,
      activeReservesTotal: active,
      reserveDrift: drift,
      expiringReserves15m: expiringCount,
      timestamp: new Date().toISOString(),
    };
  }

  async reserveFunds(
    userId: string,
    transactionId: string,
    amount: number,
    expirationMinutes = 30,
  ) {
    // Idempotency: if a reserve already exists for this transaction, return it
    const existing = await this.reserveRepo.findOne({ where: { transactionId } });
    if (existing) {
      // If already ACTIVE we just return without relocking.
      // If already SETTLED or RELEASED we do not create a new one.
      return { reserve: existing, wallet: await this.walletRepo.findOne({ where: { id: existing.walletId } }) };
    }
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
    // Attempt to find an active reserve, if not found check with short retries for ordering issues
    let buyerReserve = await this.reserveRepo.findOne({ where: { transactionId } });
    if (!buyerReserve) {
      // Soft wait for reserve creation in case events arrive out-of-order
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => setTimeout(r, 300));
        buyerReserve = await this.reserveRepo.findOne({ where: { transactionId } });
        if (buyerReserve) break;
      }
    }
    if (!buyerReserve) {
      throw new BadRequestException('Buyer reserve not found');
    }
    if (buyerReserve.status === ReserveStatus.SETTLED) {
      const buyerWalletPrev = await this.walletRepo.findOne({ where: { id: buyerReserve.walletId } });
      return { buyerWallet: buyerWalletPrev, sellerWallet: null, reserve: buyerReserve };
    }
    if (buyerReserve.status !== ReserveStatus.ACTIVE) {
      throw new BadRequestException('Reserve not in ACTIVE state');
    }

    // Source-of-truth for settlement amount should be the reserved amount, not the incoming event amount.
    // This prevents mismatches if the event carried a stale or mutated amount.
    const settleAmount = Number(buyerReserve.amount);

    const buyerWallet = await this.walletRepo.findOne({ where: { id: buyerReserve.walletId } });
    
    if (!buyerWallet) {
      throw new BadRequestException('Buyer wallet not found');
    }

    // Check if buyer has enough locked funds (with small retry + reconciliation)
    if (Number(buyerWallet.lockedBalance) < settleAmount) {
      for (let i = 0; i < 3; i++) {
        await new Promise((r) => setTimeout(r, 300));
        const refreshed = await this.walletRepo.findOne({ where: { id: buyerWallet.id } });
        buyerWallet.lockedBalance = refreshed?.lockedBalance ?? buyerWallet.lockedBalance;
        if (Number(buyerWallet.lockedBalance) >= settleAmount) break;
      }
      if (Number(buyerWallet.lockedBalance) < settleAmount) {
        // Reconcile from reserves as source of truth
        const totalActiveLocked = await this.reserveRepo
          .createQueryBuilder('r')
          .select('COALESCE(SUM(r.amount), 0)', 'sum')
          .where('r.wallet_id = :wid', { wid: buyerWallet.id })
          .andWhere('r.status = :status', { status: ReserveStatus.ACTIVE })
          .getRawOne<{ sum: string }>();
        const lockedFromReserves = Number(totalActiveLocked?.sum || 0);
        if (lockedFromReserves > Number(buyerWallet.lockedBalance)) {
          buyerWallet.lockedBalance = lockedFromReserves;
          await this.walletRepo.save(buyerWallet);
        }
        if (Number(buyerWallet.lockedBalance) < settleAmount) {
          throw new BadRequestException('Insufficient locked funds');
        }
      }
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
  buyerWallet.lockedBalance = Number(buyerWallet.lockedBalance) - settleAmount;
  buyerWallet.balance = Number(buyerWallet.balance) - settleAmount;

    // Add to seller
  sellerWallet.balance = Number(sellerWallet.balance) + settleAmount;

    // Update reserve status
    buyerReserve.status = ReserveStatus.SETTLED;
    buyerReserve.settledAt = new Date();

    // Create transaction records
    const buyerTransaction = this.transactionRepo.create({
      walletId: buyerWallet.id,
      type: TransactionType.SETTLE_OUT,
      amount: -settleAmount,
      balanceBefore: Number(buyerWallet.balance) + settleAmount,
      balanceAfter: buyerWallet.balance,
      status: TransactionStatus.COMPLETED,
      referenceType: 'transaction',
      referenceId: transactionId,
      description: `Payment settled for transaction ${transactionId}`,
    });

    const sellerTransaction = this.transactionRepo.create({
      walletId: sellerWallet.id,
      type: TransactionType.SETTLE_IN,
      amount: settleAmount,
      balanceBefore: Number(sellerWallet.balance) - settleAmount,
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
