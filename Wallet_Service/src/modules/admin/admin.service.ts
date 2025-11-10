// src/modules/admin/admin.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Wallet } from '../../shared/entities/wallet.entity';
import { WalletTransaction } from '../../shared/entities/wallet-transaction.entity';
import { Withdrawal } from '../../shared/entities/withdrawal.entity';
import { Reserve } from '../../shared/entities/reserve.entity';
import {
  FinancialReportDto,
  TransactionReportDto,
  WalletReportDto,
  ReportQueryDto,
} from './dto/financial-report.dto';
import { WalletStatus, TransactionType, WithdrawalStatus } from '../../shared/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(Reserve)
    private readonly reserveRepository: Repository<Reserve>,
  ) {}

  /**
   * Báo cáo tài chính tổng quan
   */
  async getFinancialReport(query: ReportQueryDto): Promise<FinancialReportDto> {
    const whereClause = this.buildDateFilter(query);

    // Thống kê ví
    const walletStats = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('COUNT(wallet.id)', 'totalWallets')
      .addSelect('COUNT(CASE WHEN wallet.status = :active THEN 1 END)', 'activeWallets')
      .addSelect('SUM(wallet.balance)', 'totalBalance')
      .addSelect('SUM(wallet.locked_balance)', 'totalLockedBalance')
      .setParameter('active', WalletStatus.ACTIVE)
      .getRawOne();

    // Thống kê giao dịch
    const transactionStats = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COUNT(tx.id)', 'totalTransactions')
      .addSelect('COUNT(CASE WHEN tx.type = :deposit THEN 1 END)', 'totalDeposits')
      .addSelect('COUNT(CASE WHEN tx.type = :withdrawal THEN 1 END)', 'totalWithdrawals')
      .addSelect('COUNT(CASE WHEN tx.type = :reserve THEN 1 END)', 'totalReserves')
      .addSelect('COUNT(CASE WHEN tx.type = :release THEN 1 END)', 'totalReleases')
      .addSelect('SUM(CASE WHEN tx.type = :deposit THEN tx.amount ELSE 0 END)', 'depositAmount')
      .addSelect('SUM(CASE WHEN tx.type = :withdrawal THEN tx.amount ELSE 0 END)', 'withdrawalAmount')
      .addSelect('SUM(CASE WHEN tx.type = :reserve THEN tx.amount ELSE 0 END)', 'reserveAmount')
      .addSelect('SUM(CASE WHEN tx.type = :release THEN tx.amount ELSE 0 END)', 'releaseAmount')
      .where(whereClause.where, whereClause.params)
      .setParameter('deposit', TransactionType.DEPOSIT)
      .setParameter('withdrawal', TransactionType.WITHDRAWAL)
      .setParameter('reserve', TransactionType.RESERVE)
      .setParameter('release', TransactionType.RELEASE)
      .getRawOne();

    // Thống kê withdrawal
    const withdrawalStats = await this.withdrawalRepository
      .createQueryBuilder('wd')
      .select('COUNT(CASE WHEN wd.status = :pending THEN 1 END)', 'pendingWithdrawals')
      .addSelect('SUM(CASE WHEN wd.status = :pending THEN wd.amount ELSE 0 END)', 'pendingWithdrawalAmount')
      .addSelect('COUNT(CASE WHEN wd.status = :completed THEN 1 END)', 'completedWithdrawals')
      .addSelect('SUM(CASE WHEN wd.status = :completed THEN wd.amount ELSE 0 END)', 'completedWithdrawalAmount')
      .where(whereClause.where, whereClause.params)
      .setParameter('pending', WithdrawalStatus.PENDING)
      .setParameter('completed', WithdrawalStatus.COMPLETED)
      .getRawOne();

    return {
      totalBalance: parseFloat(walletStats.totalBalance || 0),
      totalLockedBalance: parseFloat(walletStats.totalLockedBalance || 0),
      totalAvailableBalance: parseFloat(walletStats.totalBalance || 0) - parseFloat(walletStats.totalLockedBalance || 0),
      totalWallets: parseInt(walletStats.totalWallets || 0),
      activeWallets: parseInt(walletStats.activeWallets || 0),
      
      totalTransactions: parseInt(transactionStats.totalTransactions || 0),
      totalDeposits: parseInt(transactionStats.totalDeposits || 0),
      totalWithdrawals: parseInt(transactionStats.totalWithdrawals || 0),
      totalReserves: parseInt(transactionStats.totalReserves || 0),
      totalReleases: parseInt(transactionStats.totalReleases || 0),
      
      depositAmount: parseFloat(transactionStats.depositAmount || 0),
      withdrawalAmount: parseFloat(transactionStats.withdrawalAmount || 0),
      reserveAmount: parseFloat(transactionStats.reserveAmount || 0),
      releaseAmount: parseFloat(transactionStats.releaseAmount || 0),
      
      pendingWithdrawals: parseInt(withdrawalStats.pendingWithdrawals || 0),
      pendingWithdrawalAmount: parseFloat(withdrawalStats.pendingWithdrawalAmount || 0),
      completedWithdrawals: parseInt(withdrawalStats.completedWithdrawals || 0),
      completedWithdrawalAmount: parseFloat(withdrawalStats.completedWithdrawalAmount || 0),
    };
  }

  /**
   * Báo cáo giao dịch theo thời gian
   */
  async getTransactionReport(query: ReportQueryDto): Promise<TransactionReportDto[]> {
    const whereClause = this.buildDateFilter(query);
    const groupByFormat = this.getDateFormat(query.groupBy || 'day');

    const results = await this.transactionRepository
      .createQueryBuilder('tx')
      .select(`DATE_FORMAT(tx.created_at, '${groupByFormat}')`, 'date')
      .addSelect('COUNT(tx.id)', 'totalTransactions')
      .addSelect('COUNT(CASE WHEN tx.type = :deposit THEN 1 END)', 'deposits')
      .addSelect('COUNT(CASE WHEN tx.type = :withdrawal THEN 1 END)', 'withdrawals')
      .addSelect('COUNT(CASE WHEN tx.type = :reserve THEN 1 END)', 'reserves')
      .addSelect('COUNT(CASE WHEN tx.type = :release THEN 1 END)', 'releases')
      .addSelect('COUNT(CASE WHEN tx.type = :refund THEN 1 END)', 'refunds')
      .addSelect('SUM(CASE WHEN tx.type = :deposit THEN tx.amount ELSE 0 END)', 'depositAmount')
      .addSelect('SUM(CASE WHEN tx.type = :withdrawal THEN tx.amount ELSE 0 END)', 'withdrawalAmount')
      .addSelect('SUM(CASE WHEN tx.type = :reserve THEN tx.amount ELSE 0 END)', 'reserveAmount')
      .addSelect('SUM(CASE WHEN tx.type = :release THEN tx.amount ELSE 0 END)', 'releaseAmount')
      .addSelect('SUM(CASE WHEN tx.type = :refund THEN tx.amount ELSE 0 END)', 'refundAmount')
      .where(whereClause.where, whereClause.params)
      .groupBy('date')
      .orderBy('date', 'DESC')
      .limit(query.limit || 30)
      .setParameter('deposit', TransactionType.DEPOSIT)
      .setParameter('withdrawal', TransactionType.WITHDRAWAL)
      .setParameter('reserve', TransactionType.RESERVE)
      .setParameter('release', TransactionType.RELEASE)
      .setParameter('refund', TransactionType.REFUND)
      .getRawMany();

    return results.map(r => ({
      date: r.date,
      totalTransactions: parseInt(r.totalTransactions || 0),
      deposits: parseInt(r.deposits || 0),
      withdrawals: parseInt(r.withdrawals || 0),
      reserves: parseInt(r.reserves || 0),
      releases: parseInt(r.releases || 0),
      refunds: parseInt(r.refunds || 0),
      depositAmount: parseFloat(r.depositAmount || 0),
      withdrawalAmount: parseFloat(r.withdrawalAmount || 0),
      reserveAmount: parseFloat(r.reserveAmount || 0),
      releaseAmount: parseFloat(r.releaseAmount || 0),
      refundAmount: parseFloat(r.refundAmount || 0),
    }));
  }

  /**
   * Báo cáo ví
   */
  async getWalletReport(): Promise<WalletReportDto> {
    // Thống kê tổng quan
    const stats = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('COUNT(wallet.id)', 'totalWallets')
      .addSelect('COUNT(CASE WHEN wallet.status = :active THEN 1 END)', 'activeWallets')
      .addSelect('COUNT(CASE WHEN wallet.status = :suspended THEN 1 END)', 'suspendedWallets')
      .addSelect('COUNT(CASE WHEN wallet.status = :closed THEN 1 END)', 'closedWallets')
      .addSelect('SUM(wallet.balance)', 'totalBalance')
      .addSelect('SUM(wallet.locked_balance)', 'totalLockedBalance')
      .addSelect('AVG(wallet.balance)', 'averageBalance')
      .setParameter('active', WalletStatus.ACTIVE)
      .setParameter('suspended', WalletStatus.SUSPENDED)
      .setParameter('closed', WalletStatus.CLOSED)
      .getRawOne();

    // Top 10 ví có số dư cao nhất
    const topWallets = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.transactions', 'tx')
      .select('wallet.user_id', 'userId')
      .addSelect('wallet.balance', 'balance')
      .addSelect('wallet.locked_balance', 'lockedBalance')
      .addSelect('COUNT(tx.id)', 'transactionCount')
      .groupBy('wallet.id')
      .orderBy('wallet.balance', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalWallets: parseInt(stats.totalWallets || 0),
      activeWallets: parseInt(stats.activeWallets || 0),
      suspendedWallets: parseInt(stats.suspendedWallets || 0),
      closedWallets: parseInt(stats.closedWallets || 0),
      totalBalance: parseFloat(stats.totalBalance || 0),
      totalLockedBalance: parseFloat(stats.totalLockedBalance || 0),
      averageBalance: parseFloat(stats.averageBalance || 0),
      topWallets: topWallets.map(w => ({
        userId: w.userId,
        balance: parseFloat(w.balance || 0),
        lockedBalance: parseFloat(w.lockedBalance || 0),
        transactionCount: parseInt(w.transactionCount || 0),
      })),
    };
  }

  /**
   * Build date filter for queries
   */
  private buildDateFilter(query: ReportQueryDto): { where: string; params: any } {
    if (query.startDate && query.endDate) {
      return {
        where: 'created_at BETWEEN :startDate AND :endDate',
        params: { startDate: query.startDate, endDate: query.endDate },
      };
    } else if (query.startDate) {
      return {
        where: 'created_at >= :startDate',
        params: { startDate: query.startDate },
      };
    } else if (query.endDate) {
      return {
        where: 'created_at <= :endDate',
        params: { endDate: query.endDate },
      };
    }
    return { where: '1=1', params: {} };
  }

  /**
   * Get date format for grouping
   */
  private getDateFormat(groupBy: 'day' | 'week' | 'month'): string {
    switch (groupBy) {
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-%u';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }
}
