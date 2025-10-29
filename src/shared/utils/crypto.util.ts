// src/shared/utils/crypto.util.ts
import * as crypto from 'crypto';

export class CryptoUtil {
  /**
   * Sort object keys in ASCII order (shallow).
   */
  static sortObject<T extends Record<string, any>>(obj: T): T {
    const sorted: Record<string, any> = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = obj[key];
      });
    return sorted as T;
  }

  /**
   * Create HMAC SHA512 in hex, using UTF-8 (lowercase hex).
   * Caller có thể .toUpperCase() tùy nhu cầu so sánh với VNPay.
   */
  static createHmacSha512(secret: string, data: string): string {
    return crypto.createHmac('sha512', secret).update(Buffer.from(data, 'utf-8')).digest('hex');
  }

  /**
   * Helper cho VNPay (KHÔNG dùng trong code đã sửa ở trên nữa,
   * nhưng giữ lại nếu nơi khác cần).
   */
  static createVNPaySignature(params: Record<string, string>, secret: string): string {
    const sorted = this.sortObject(params);
    const signData = Object.keys(sorted)
      .map((k) => `${k}=${sorted[k]}`)
      .join('&'); // no encode
    return this.createHmacSha512(secret, signData);
  }

  /**
   * Generate UUID v4
   */
  static uuid(): string {
    if (typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
    // Fallback nếu runtime quá cũ
    const buf = crypto.randomBytes(16);
    buf[6] = (buf[6] & 0x0f) | 0x40; // version 4
    buf[8] = (buf[8] & 0x3f) | 0x80; // variant
    const hex = buf.toString('hex');
    return `${hex.substring(0,8)}-${hex.substring(8,12)}-${hex.substring(12,16)}-${hex.substring(16,20)}-${hex.substring(20)}`;
  }
}
