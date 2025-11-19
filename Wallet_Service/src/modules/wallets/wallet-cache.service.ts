// src/modules/wallets/wallet-cache.service.ts

import { Injectable } from '@nestjs/common';
import { CacheService } from '../../redis/cache.service';

@Injectable()
export class WalletCacheService {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Wallet Balance cache
   */
  async getWalletBalance(userId: string): Promise<any> {
    return this.cacheService.get(`wallet:balance:${userId}`);
  }

  async setWalletBalance(userId: string, data: any, ttl: number = 300): Promise<void> {
    await this.cacheService.set(`wallet:balance:${userId}`, data, ttl);
  }

  async invalidateWalletBalance(userId: string): Promise<void> {
    await this.cacheService.del(`wallet:balance:${userId}`);
  }

  /**
   * Wallet Summary cache
   */
  async getWalletSummary(userId: string): Promise<any> {
    return this.cacheService.get(`wallet:summary:${userId}`);
  }

  async setWalletSummary(userId: string, data: any, ttl: number = 300): Promise<void> {
    await this.cacheService.set(`wallet:summary:${userId}`, data, ttl);
  }

  async invalidateWalletSummary(userId: string): Promise<void> {
    await this.cacheService.del(`wallet:summary:${userId}`);
  }

  /**
   * Transaction History cache (paginated)
   */
  async getTransactionHistory(userId: string, page: number): Promise<any> {
    return this.cacheService.get(`wallet:transactions:${userId}:page:${page}`);
  }

  async setTransactionHistory(userId: string, page: number, data: any, ttl: number = 600): Promise<void> {
    await this.cacheService.set(`wallet:transactions:${userId}:page:${page}`, data, ttl);
  }

  async invalidateTransactionHistory(userId: string): Promise<void> {
    // Clear first 10 pages (most commonly accessed)
    const deletePromises = [];
    for (let i = 1; i <= 10; i++) {
      deletePromises.push(this.cacheService.del(`wallet:transactions:${userId}:page:${i}`));
    }
    await Promise.all(deletePromises);
  }

  /**
   * Invalidate all wallet-related cache for a user
   */
  async invalidateAllForUser(userId: string): Promise<void> {
    await Promise.all([
      this.invalidateWalletBalance(userId),
      this.invalidateWalletSummary(userId),
      this.invalidateTransactionHistory(userId),
    ]);
    console.log(`🗑️ Invalidated all wallet cache for user ${userId}`);
  }
}
