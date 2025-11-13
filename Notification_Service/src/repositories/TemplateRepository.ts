import { RowDataPacket } from "mysql2";
import pool from "../config/database";
import logger from "../config/logger";
import { Template, Channel, ITemplateRepository } from "../types/notification";

export class TemplateRepository implements ITemplateRepository {
  private cache: Map<string, Template> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  async findByEventAndChannel(
    eventType: string,
    channel: Channel
  ): Promise<Template | null> {
    const cacheKey = `${eventType}:${channel}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      logger.debug("Template found in cache", { eventType, channel });
      return cached;
    }

    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, event_type, channel, subject, content, placeholders, is_active,
               created_at, updated_at
        FROM notification_templates
        WHERE event_type = ? AND channel = ? AND is_active = TRUE
      `;

      const [rows] = await connection.execute<RowDataPacket[]>(query, [
        eventType,
        channel,
      ]);

      if (rows.length === 0) {
        logger.warn("Template not found", { eventType, channel });
        return null;
      }

      const template = this.mapRowToTemplate(rows[0]);

      // Cache the template
      this.cache.set(cacheKey, template);
      setTimeout(() => this.cache.delete(cacheKey), this.cacheExpiry);

      logger.info("Template found", {
        eventType,
        channel,
        templateId: template.id,
      });
      return template;
    } catch (error) {
      logger.error("Error finding template", { error, eventType, channel });
      throw error;
    } finally {
      connection.release();
    }
  }

  async findAll(): Promise<Template[]> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, event_type, channel, subject, content, placeholders, is_active,
               created_at, updated_at
        FROM notification_templates
        ORDER BY event_type, channel
      `;

      const [rows] = await connection.execute<RowDataPacket[]>(query);

      return rows.map((row) => this.mapRowToTemplate(row));
    } catch (error) {
      logger.error("Error finding all templates", { error });
      throw error;
    } finally {
      connection.release();
    }
  }

  async findActive(): Promise<Template[]> {
    const connection = await pool.getConnection();
    try {
      const query = `
        SELECT id, event_type, channel, subject, content, placeholders, is_active,
               created_at, updated_at
        FROM notification_templates
        WHERE is_active = TRUE
        ORDER BY event_type, channel
      `;

      const [rows] = await connection.execute<RowDataPacket[]>(query);

      return rows.map((row) => this.mapRowToTemplate(row));
    } catch (error) {
      logger.error("Error finding active templates", { error });
      throw error;
    } finally {
      connection.release();
    }
  }

  clearCache(): void {
    this.cache.clear();
    logger.info("Template cache cleared");
  }

  private mapRowToTemplate(row: RowDataPacket): Template {
    let placeholders: string[] = [];

    if (row.placeholders) {
      try {
        placeholders =
          typeof row.placeholders === "string"
            ? JSON.parse(row.placeholders)
            : row.placeholders;
      } catch (error) {
        logger.error("Error parsing placeholders", {
          error,
          placeholders: row.placeholders,
        });
      }
    }

    return {
      id: row.id,
      event_type: row.event_type,
      channel: row.channel as Channel,
      subject: row.subject,
      content: row.content,
      placeholders,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export default new TemplateRepository();
