import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return await this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  /**
   * User-specific cache methods
   */
  async getUserProfile(userId: string): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  async setUserProfile(userId: string, profile: any, ttl: number = 3600): Promise<void> {
    await this.set(`user:${userId}`, profile, ttl);
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    await this.del(`user:${userId}`);
  }

  /**
   * Session management
   */
  async getSession(sessionId: string): Promise<any> {
    return await this.get(`session:${sessionId}`);
  }

  async setSession(sessionId: string, sessionData: any, ttl: number = 86400): Promise<void> {
    // Default TTL: 24 hours
    await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.del(`session:${sessionId}`);
  }

  /**
   * JWT Blacklist for logout
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const result = await this.get(`jwt:blacklist:${token}`);
    return !!result;
  }

  async blacklistToken(token: string, ttl: number): Promise<void> {
    // TTL should match JWT expiration time
    await this.set(`jwt:blacklist:${token}`, true, ttl);
  }

  /**
   * User email verification cache
   */
  async getVerificationCode(email: string): Promise<string | undefined> {
    return await this.get(`verify:email:${email}`);
  }

  async setVerificationCode(email: string, code: string, ttl: number = 600): Promise<void> {
    // Default TTL: 10 minutes
    await this.set(`verify:email:${email}`, code, ttl);
  }

  async deleteVerificationCode(email: string): Promise<void> {
    await this.del(`verify:email:${email}`);
  }

  /**
   * Password reset cache
   */
  async getPasswordResetToken(userId: string): Promise<string | undefined> {
    return await this.get(`password:reset:${userId}`);
  }

  async setPasswordResetToken(userId: string, token: string, ttl: number = 1800): Promise<void> {
    // Default TTL: 30 minutes
    await this.set(`password:reset:${userId}`, token, ttl);
  }

  async deletePasswordResetToken(userId: string): Promise<void> {
    await this.del(`password:reset:${userId}`);
  }
}
