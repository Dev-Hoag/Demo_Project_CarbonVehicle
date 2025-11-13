import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/database";
import logger from "../config/logger";
import {
  NotificationEntity,
  CreateNotificationDto,
  QueryOptions,
  DeliveryStatus,
  INotificationRepository,
  Channel,
  Priority,
} from "../types/notification";

export class NotificationRepository implements INotificationRepository {
  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    const connection = await pool.getConnection();
    try {
      const query = `
        INSERT INTO notifications (user_id, type, channel, subject, content, priority, status)
        VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
      `;

      const [result] = await connection.execute<ResultSetHeader>(query, [
        dto.user_id,
        dto.type,
        dto.channel,
        dto.subject || null,
        dto.content,
        dto.priority || Priority.MEDIUM,
      ]);

      const notificationId = result.insertId;

      // Insert metadata if provided
      if (dto.metadata && Object.keys(dto.metadata).length > 0) {
        const metadataQuery = `
          INSERT INTO notification_metadata (notification_id, key_name, value)
          VALUES (?, ?, ?)
        `;

        for (const [key, value] of Object.entries(dto.metadata)) {
          await connection.execute(metadataQuery, [
            notificationId,
            key,
            JSON.stringify(value),
          ]);
        }
      }

      logger.info("Notification created", { notificationId, type: dto.type });

      const notification = await this.findById(notificationId);
      if (!notification) {
        throw new Error("Failed to retrieve created notification");
      }

      return notification;
    } catch (error) {
      logger.error("Error creating notification", { error, dto });
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id: number): Promise<NotificationEntity | null> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, user_id, type, channel, subject, content, status, priority,
               created_at, sent_at, read_at
        FROM notifications
        WHERE id = ?
      `;

      const [rows] = await connection.execute<RowDataPacket[]>(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return this.mapRowToEntity(rows[0]);
    } catch (error) {
      logger.error("Error finding notification by id", { error, id });
      throw error;
    } finally {
      connection.release();
    }
  }

  async findByUserId(
    userId: number,
    options: QueryOptions = {}
  ): Promise<NotificationEntity[]> {
    const connection = await pool.getConnection();
    try {
      const {
        limit = 20,
        offset = 0,
        status,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = options;

      let query = `
        SELECT id, user_id, type, channel, subject, content, status, priority,
               created_at, sent_at, read_at
        FROM notifications
        WHERE user_id = ?
      `;

      const params: any[] = [userId];

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY ${sortBy} ${sortOrder}`;
      query += ` LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const [rows] = await connection.execute<RowDataPacket[]>(query, params);

      return rows.map((row) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error("Error finding notifications by user id", {
        error,
        userId,
        options,
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  async findUnread(userId: number): Promise<NotificationEntity[]> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, user_id, type, channel, subject, content, status, priority,
               created_at, sent_at, read_at
        FROM notifications
        WHERE user_id = ? AND status IN ('PENDING', 'SENT') AND channel = 'IN_APP'
        ORDER BY created_at DESC
      `;

      const [rows] = await connection.execute<RowDataPacket[]>(query, [userId]);

      return rows.map((row) => this.mapRowToEntity(row));
    } catch (error) {
      logger.error("Error finding unread notifications", { error, userId });
      throw error;
    } finally {
      connection.release();
    }
  }

  async markAsRead(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE notifications
        SET status = 'READ', read_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status != 'READ'
      `;

      const [result] = await connection.execute<ResultSetHeader>(query, [id]);

      const success = result.affectedRows > 0;
      if (success) {
        logger.info("Notification marked as read", { id });
      }

      return success;
    } catch (error) {
      logger.error("Error marking notification as read", { error, id });
      throw error;
    } finally {
      connection.release();
    }
  }

  async markAllAsRead(userId: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const query = `
        UPDATE notifications
        SET status = 'READ', read_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND status IN ('PENDING', 'SENT') AND channel = 'IN_APP'
      `;

      const [result] = await connection.execute<ResultSetHeader>(query, [
        userId,
      ]);

      logger.info("All notifications marked as read", {
        userId,
        count: result.affectedRows,
      });

      return result.affectedRows;
    } catch (error) {
      logger.error("Error marking all notifications as read", {
        error,
        userId,
      });
      throw error;
    } finally {
      connection.release();
    }
  }

  async delete(id: number): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const query = `DELETE FROM notifications WHERE id = ?`;

      const [result] = await connection.execute<ResultSetHeader>(query, [id]);

      const success = result.affectedRows > 0;
      if (success) {
        logger.info("Notification deleted", { id });
      }

      return success;
    } catch (error) {
      logger.error("Error deleting notification", { error, id });
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateStatus(id: number, status: DeliveryStatus): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      let query = `UPDATE notifications SET status = ?`;
      const params: any[] = [status];

      if (status === DeliveryStatus.SENT) {
        query += `, sent_at = CURRENT_TIMESTAMP`;
      } else if (status === DeliveryStatus.READ) {
        query += `, read_at = CURRENT_TIMESTAMP`;
      }

      query += ` WHERE id = ?`;
      params.push(id);

      const [result] = await connection.execute<ResultSetHeader>(query, params);

      const success = result.affectedRows > 0;
      if (success) {
        logger.info("Notification status updated", { id, status });
      }

      return success;
    } catch (error) {
      logger.error("Error updating notification status", { error, id, status });
      throw error;
    } finally {
      connection.release();
    }
  }

  async countUnread(userId: number): Promise<number> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE user_id = ? AND status IN ('PENDING', 'SENT') AND channel = 'IN_APP'
      `;

      const [rows] = await connection.execute<RowDataPacket[]>(query, [userId]);

      return rows[0].count;
    } catch (error) {
      logger.error("Error counting unread notifications", { error, userId });
      throw error;
    } finally {
      connection.release();
    }
  }

  private mapRowToEntity(row: RowDataPacket): NotificationEntity {
    return {
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      channel: row.channel as Channel,
      subject: row.subject,
      content: row.content,
      status: row.status as DeliveryStatus,
      priority: row.priority as Priority,
      created_at: row.created_at,
      sent_at: row.sent_at,
      read_at: row.read_at,
    };
  }
}

export default new NotificationRepository();
