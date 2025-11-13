import pool from '../config/database';
import { Transaction, TransactionStatus, CreateTransactionDTO } from '../types/transaction';

export class TransactionRepository {
  async create(data: CreateTransactionDTO): Promise<Transaction> {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO transactions 
        (listing_id, buyer_id, seller_id, credit_amount, price_per_credit, total_price, currency, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        data.listing_id,
        data.buyer_id,
        data.seller_id,
        data.credit_amount,
        data.price_per_credit,
        data.total_price,
        data.currency || 'VND',
        TransactionStatus.PENDING
      ]);

      const insertId = (result as any).insertId;
      return this.findById(insertId) as Promise<Transaction>;
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<Transaction | null> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transactions WHERE id = ?';
      const [rows] = await connection.execute(query, [id]);
      return (rows as any[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async findByBuyerId(buyer_id: number, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const connection = await pool.getConnection();
    try {
      const query = `SELECT * FROM transactions WHERE buyer_id = ? ORDER BY created_at DESC LIMIT ${Math.max(1, limit)} OFFSET ${Math.max(0, offset)}`;
      const [rows] = await connection.execute(query, [buyer_id]);
      return rows as Transaction[];
    } finally {
      connection.release();
    }
  }

  async findBySellerId(seller_id: number, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const connection = await pool.getConnection();
    try {
      const query = `SELECT * FROM transactions WHERE seller_id = ? ORDER BY created_at DESC LIMIT ${Math.max(1, limit)} OFFSET ${Math.max(0, offset)}`;
      const [rows] = await connection.execute(query, [seller_id]);
      return rows as Transaction[];
    } finally {
      connection.release();
    }
  }

  async findByStatus(status: TransactionStatus, limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const connection = await pool.getConnection();
    try {
      const query = `SELECT * FROM transactions WHERE status = ? ORDER BY created_at DESC LIMIT ${Math.max(1, limit)} OFFSET ${Math.max(0, offset)}`;
      const [rows] = await connection.execute(query, [status]);
      return rows as Transaction[];
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: TransactionStatus): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const query = 'UPDATE transactions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await connection.execute(query, [status, id]);
    } finally {
      connection.release();
    }
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<Transaction[]> {
    const connection = await pool.getConnection();
    try {
      const query = `SELECT * FROM transactions ORDER BY created_at DESC LIMIT ${Math.max(1, limit)} OFFSET ${Math.max(0, offset)}`;
      const [rows] = await connection.execute(query);
      return rows as Transaction[];
    } finally {
      connection.release();
    }
  }

  async countByBuyerId(buyer_id: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT COUNT(*) as count FROM transactions WHERE buyer_id = ?';
      const [rows] = await connection.execute(query, [buyer_id]);
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async countBySellerId(seller_id: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT COUNT(*) as count FROM transactions WHERE seller_id = ?';
      const [rows] = await connection.execute(query, [seller_id]);
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async findExpiredTransactions(): Promise<Transaction[]> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT * FROM transactions 
        WHERE status = ? AND expires_at < NOW()
      `;
      const [rows] = await connection.execute(query, [TransactionStatus.PENDING]);
      return rows as Transaction[];
    } finally {
      connection.release();
    }
  }

  async getTransactionSummary(id: number): Promise<any> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM v_transaction_summary WHERE id = ?';
      const [rows] = await connection.execute(query, [id]);
      return (rows as any[])[0] || null;
    } finally {
      connection.release();
    }
  }
}

export default new TransactionRepository();

