import { Injectable } from '@nestjs/common';
import { CacheService } from '../../redis/cache.service';

@Injectable()
export class NotificationCacheService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number | null> {
    return await this.cacheService.get<number>(`notification:count:${userId}`);
  }

  /**
   * Set unread notification count
   * TTL: 5 minutes (300 seconds) - balance between real-time and performance
   */
  async setUnreadCount(userId: string, count: number): Promise<void> {
    await this.cacheService.set(`notification:count:${userId}`, count, 300);
  }

  /**
   * Invalidate unread count cache when new notification arrives
   */
  async invalidateUnreadCount(userId: string): Promise<void> {
    await this.cacheService.del(`notification:count:${userId}`);
  }

  /**
   * Get recent notifications (last 10)
   */
  async getRecentNotifications(userId: string): Promise<any[] | null> {
    return await this.cacheService.get<any[]>(`notification:recent:${userId}`);
  }

  /**
   * Cache recent notifications
   * TTL: 5 minutes (300 seconds)
   */
  async setRecentNotifications(userId: string, notifications: any[]): Promise<void> {
    await this.cacheService.set(`notification:recent:${userId}`, notifications, 300);
  }

  /**
   * Invalidate recent notifications cache
   */
  async invalidateRecentNotifications(userId: string): Promise<void> {
    await this.cacheService.del(`notification:recent:${userId}`);
  }

  /**
   * Invalidate all notification cache for user (count + recent)
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateUnreadCount(userId),
      this.invalidateRecentNotifications(userId),
    ]);
  }
}
