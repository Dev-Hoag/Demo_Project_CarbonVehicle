import pool from '../config/database';
import { TransactionPayment, PaymentStatus } from '../types/transaction';

export class PaymentRepository {
  async create(transaction_id: number, payment_id: number, amount: number, payment_method?: string): Promise<TransactionPayment> {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO transaction_payments 
        (transaction_id, payment_id, payment_method, payment_status, amount)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      await connection.execute(query, [
        transaction_id,
        payment_id,
        payment_method || null,
        PaymentStatus.PENDING,
        amount
      ]);

      return this.findByTransactionId(transaction_id) as Promise<TransactionPayment>;
    } finally {
      connection.release();
    }
  }

  async findByTransactionId(transaction_id: number): Promise<TransactionPayment | null> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_payments WHERE transaction_id = ?';
      const [rows] = await connection.execute(query, [transaction_id]);
      return (rows as any[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async updateStatus(transaction_id: number, status: PaymentStatus): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE transaction_payments 
        SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `;
      await connection.execute(query, [status, transaction_id]);
    } finally {
      connection.release();
    }
  }

  async updateStatusWithTimestamp(transaction_id: number, status: PaymentStatus, timestamp: Date): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE transaction_payments 
        SET payment_status = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE transaction_id = ?
      `;
      await connection.execute(query, [status, timestamp, transaction_id]);
    } finally {
      connection.release();
    }
  }

  async findByPaymentId(payment_id: number): Promise<TransactionPayment | null> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_payments WHERE payment_id = ?';
      const [rows] = await connection.execute(query, [payment_id]);
      return (rows as any[])[0] || null;
    } finally {
      connection.release();
    }
  }
}

export default new PaymentRepository();

