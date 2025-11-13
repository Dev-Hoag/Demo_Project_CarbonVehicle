import logger from '../config/logger';
import transactionRepository from '../repositories/TransactionRepository';
import paymentRepository from '../repositories/PaymentRepository';
import {
  Transaction,
  TransactionStatus,
  CreateTransactionDTO,
  PaymentStatus
} from '../types/transaction';
import pool from '../config/database';

const PLATFORM_FEE_PERCENTAGE = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '0.05');

export class TransactionService {
  
  async createTransaction(data: CreateTransactionDTO): Promise<Transaction> {
    logger.info('Creating transaction', { data });
    
    try {
      // Validate input
      if (data.buyer_id === data.seller_id) {
        throw new Error('Buyer and seller cannot be the same');
      }
      
      if (data.total_price <= 0 || data.credit_amount <= 0) {
        throw new Error('Price and credit amount must be positive');
      }

      // Create transaction
      const transaction = await transactionRepository.create(data);
      
      // Create related records
      await this.initializeTransactionRecords(transaction.id, data.total_price);
      
      logger.info('Transaction created successfully', { transaction_id: transaction.id });
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction', { error, data });
      throw error;
    }
  }

  private async initializeTransactionRecords(transaction_id: number, total_price: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      // Create escrow record
      const escrowQuery = `
        INSERT INTO transaction_escrows (transaction_id, amount_held)
        VALUES (?, ?)
      `;
      await connection.execute(escrowQuery, [transaction_id, total_price]);

      // Create settlement record
      const settlementQuery = `
        INSERT INTO transaction_settlements (transaction_id, seller_amount, platform_fee)
        VALUES (?, ?, ?)
      `;
      const platformFee = total_price * PLATFORM_FEE_PERCENTAGE;
      const sellerAmount = total_price - platformFee;
      await connection.execute(settlementQuery, [transaction_id, sellerAmount, platformFee]);

      // Create wallet record
      const walletQuery = `
        INSERT INTO transaction_wallets (transaction_id, buyer_wallet_reserve_id, seller_settlement_id)
        VALUES (?, ?, ?)
      `;
      await connection.execute(walletQuery, [transaction_id, 0, 0]);

      // Create credit record
      const creditQuery = `
        INSERT INTO transaction_credits (transaction_id, credit_transfer_id)
        VALUES (?, ?)
      `;
      await connection.execute(creditQuery, [transaction_id, 0]);

    } finally {
      connection.release();
    }
  }

  async getTransaction(id: number): Promise<Transaction | null> {
    try {
      return await transactionRepository.findById(id);
    } catch (error) {
      logger.error('Error fetching transaction', { error, id });
      throw error;
    }
  }

  async getTransactionSummary(id: number): Promise<any> {
    try {
      return await transactionRepository.getTransactionSummary(id);
    } catch (error) {
      logger.error('Error fetching transaction summary', { error, id });
      throw error;
    }
  }

  async getBuyerTransactions(buyer_id: number, limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const transactions = await transactionRepository.findByBuyerId(buyer_id, limit, offset);
      const total = await transactionRepository.countByBuyerId(buyer_id);
      return { transactions, total, limit, offset };
    } catch (error) {
      logger.error('Error fetching buyer transactions', { error, buyer_id });
      throw error;
    }
  }

  async getSellerTransactions(seller_id: number, limit: number = 20, offset: number = 0): Promise<any> {
    try {
      const transactions = await transactionRepository.findBySellerId(seller_id, limit, offset);
      const total = await transactionRepository.countBySellerId(seller_id);
      return { transactions, total, limit, offset };
    } catch (error) {
      logger.error('Error fetching seller transactions', { error, seller_id });
      throw error;
    }
  }

  async updateTransactionStatus(id: number, status: TransactionStatus, reason?: string): Promise<void> {
    logger.info('Updating transaction status', { id, status, reason });
    
    try {
      const transaction = await transactionRepository.findById(id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Validate state transition
      this.validateStateTransition(transaction.status, status);

      // Update status
      await transactionRepository.updateStatus(id, status);

      // Record history
      await this.recordTransactionHistory(id, transaction.status, status, reason);

      logger.info('Transaction status updated', { id, status });
    } catch (error) {
      logger.error('Error updating transaction status', { error, id, status });
      throw error;
    }
  }

  private validateStateTransition(currentStatus: TransactionStatus, newStatus: TransactionStatus): void {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.PENDING]: [
        TransactionStatus.PAYMENT_PENDING,
        TransactionStatus.CANCELLED,
        TransactionStatus.DISPUTED
      ],
      [TransactionStatus.PAYMENT_PENDING]: [
        TransactionStatus.PAYMENT_COMPLETED,
        TransactionStatus.CANCELLED,
        TransactionStatus.DISPUTED
      ],
      [TransactionStatus.PAYMENT_COMPLETED]: [
        TransactionStatus.CREDIT_TRANSFERRED,
        TransactionStatus.CANCELLED,
        TransactionStatus.DISPUTED
      ],
      [TransactionStatus.CREDIT_TRANSFERRED]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED,
        TransactionStatus.DISPUTED
      ],
      [TransactionStatus.COMPLETED]: [TransactionStatus.DISPUTED],
      [TransactionStatus.CANCELLED]: [],
      [TransactionStatus.DISPUTED]: [
        TransactionStatus.COMPLETED,
        TransactionStatus.CANCELLED
      ]
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid state transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async recordTransactionHistory(
    transaction_id: number,
    oldStatus: string,
    newStatus: string,
    reason?: string
  ): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO transaction_history (transaction_id, old_status, new_status, reason)
        VALUES (?, ?, ?, ?)
      `;
      await connection.execute(query, [transaction_id, oldStatus, newStatus, reason || null]);
    } finally {
      connection.release();
    }
  }

  async cancelTransaction(id: number, reason: string): Promise<void> {
    logger.info('Cancelling transaction', { id, reason });
    
    try {
      const transaction = await transactionRepository.findById(id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status === TransactionStatus.COMPLETED) {
        throw new Error('Cannot cancel completed transaction');
      }

      await this.updateTransactionStatus(id, TransactionStatus.CANCELLED, reason);
      logger.info('Transaction cancelled', { id });
    } catch (error) {
      logger.error('Error cancelling transaction', { error, id });
      throw error;
    }
  }

  async handlePaymentCompleted(transaction_id: number): Promise<void> {
    logger.info('Handling payment completed', { transaction_id });
    
    try {
      const transaction = await transactionRepository.findById(transaction_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      await paymentRepository.updateStatusWithTimestamp(
        transaction_id,
        PaymentStatus.COMPLETED,
        new Date()
      );

      await this.updateTransactionStatus(transaction_id, TransactionStatus.PAYMENT_COMPLETED);
      logger.info('Payment completed handled', { transaction_id });
    } catch (error) {
      logger.error('Error handling payment completed', { error, transaction_id });
      throw error;
    }
  }

  async handlePaymentFailed(transaction_id: number): Promise<void> {
    logger.info('Handling payment failed', { transaction_id });
    
    try {
      await paymentRepository.updateStatus(transaction_id, PaymentStatus.FAILED);
      await this.updateTransactionStatus(transaction_id, TransactionStatus.CANCELLED, 'Payment failed');
      logger.info('Payment failed handled', { transaction_id });
    } catch (error) {
      logger.error('Error handling payment failed', { error, transaction_id });
      throw error;
    }
  }
}

export default new TransactionService();

