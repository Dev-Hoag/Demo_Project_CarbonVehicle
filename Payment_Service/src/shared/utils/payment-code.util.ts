export class PaymentCodeUtil {
  /**
   * Generate payment code
   * Format: PAY_TIMESTAMP_RANDOM
   * Example: PAY_1704067200000_A5F3D9
   */
  static generate(prefix: string = 'PAY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate refund code
   */
  static generateRefundCode(): string {
    return this.generate('REF');
  }

  /**
   * Generate idempotency key from request
   */
  static generateIdempotencyKey(
    userId: number,
    transactionId: string,
    amount: number,
  ): string {
    const data = `${userId}_${transactionId}_${amount}`;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Parse payment code to get timestamp
   */
  static getTimestamp(paymentCode: string): number | null {
    try {
      const parts = paymentCode.split('_');
      if (parts.length >= 2) {
        return parseInt(parts[1], 10);
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}