import pool from '../config/database';
import { TransactionDispute, DisputeStatus, CreateDisputeDTO } from '../types/transaction';

export class DisputeRepository {
  async create(data: CreateDisputeDTO): Promise<TransactionDispute> {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO transaction_disputes 
        (transaction_id, raised_by, reason, description, status)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        data.transaction_id,
        data.raised_by,
        data.reason,
        data.description || null,
        DisputeStatus.OPEN
      ]);

      const insertId = (result as any).insertId;
      return this.findById(insertId) as Promise<TransactionDispute>;
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<TransactionDispute | null> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_disputes WHERE id = ?';
      const [rows] = await connection.execute(query, [id]);
      return (rows as any[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async findByTransactionId(transaction_id: number): Promise<TransactionDispute | null> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_disputes WHERE transaction_id = ? ORDER BY created_at DESC LIMIT 1';
      const [rows] = await connection.execute(query, [transaction_id]);
      return (rows as any[])[0] || null;
    } finally {
      connection.release();
    }
  }

  async findByStatus(status: DisputeStatus, limit: number = 20, offset: number = 0): Promise<TransactionDispute[]> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_disputes WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const [rows] = await connection.execute(query, [status, limit, offset]);
      return rows as TransactionDispute[];
    } finally {
      connection.release();
    }
  }

  async findByRaisedBy(raised_by: number, limit: number = 20, offset: number = 0): Promise<TransactionDispute[]> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_disputes WHERE raised_by = ? ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const [rows] = await connection.execute(query, [raised_by, limit, offset]);
      return rows as TransactionDispute[];
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: DisputeStatus, resolution?: string, resolved_by?: number): Promise<void> {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE transaction_disputes 
        SET status = ?, resolution = ?, resolved_by = ?, resolved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      await connection.execute(query, [status, resolution || null, resolved_by || null, id]);
    } finally {
      connection.release();
    }
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<TransactionDispute[]> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM transaction_disputes ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const [rows] = await connection.execute(query, [limit, offset]);
      return rows as TransactionDispute[];
    } finally {
      connection.release();
    }
  }

  async countByStatus(status: DisputeStatus): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT COUNT(*) as count FROM transaction_disputes WHERE status = ?';
      const [rows] = await connection.execute(query, [status]);
      return (rows as any[])[0].count;
    } finally {
      connection.release();
    }
  }

  async getActiveDisputes(limit: number = 20, offset: number = 0): Promise<any[]> {
    const connection = await pool.getConnection();
    try {
      const query = 'SELECT * FROM v_active_disputes LIMIT ? OFFSET ?';
      const [rows] = await connection.execute(query, [limit, offset]);
      return rows as any[];
    } finally {
      connection.release();
    }
  }
}

export default new DisputeRepository();

