// src/shared/enums/transaction-type.enum.ts

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',      // P2P transfer
  RESERVE = 'RESERVE',
  RELEASE = 'RELEASE',
  SETTLE_IN = 'SETTLE_IN',    // Money in (seller receives)
  SETTLE_OUT = 'SETTLE_OUT',  // Money out (buyer pays)
  REFUND = 'REFUND',
  FEE = 'FEE',
  ADJUSTMENT = 'ADJUSTMENT',  // Admin adjustment
}
