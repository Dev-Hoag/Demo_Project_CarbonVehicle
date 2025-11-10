// src/modules/admin/dto/financial-report.dto.ts

export class FinancialReportDto {
  totalBalance: number;
  totalLockedBalance: number;
  totalAvailableBalance: number;
  totalWallets: number;
  activeWallets: number;
  
  totalTransactions: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalReserves: number;
  totalReleases: number;
  
  depositAmount: number;
  withdrawalAmount: number;
  reserveAmount: number;
  releaseAmount: number;
  
  pendingWithdrawals: number;
  pendingWithdrawalAmount: number;
  completedWithdrawals: number;
  completedWithdrawalAmount: number;
}

export class TransactionReportDto {
  date: string;
  totalTransactions: number;
  deposits: number;
  withdrawals: number;
  reserves: number;
  releases: number;
  refunds: number;
  depositAmount: number;
  withdrawalAmount: number;
  reserveAmount: number;
  releaseAmount: number;
  refundAmount: number;
}

export class WalletReportDto {
  totalWallets: number;
  activeWallets: number;
  suspendedWallets: number;
  closedWallets: number;
  totalBalance: number;
  totalLockedBalance: number;
  averageBalance: number;
  topWallets: Array<{
    userId: string;
    balance: number;
    lockedBalance: number;
    transactionCount: number;
  }>;
}

export class ReportQueryDto {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
}
