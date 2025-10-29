export class RetryUtil {
  /**
   * Calculate next retry time with exponential backoff
   */
  static calculateNextRetryTime(retryCount: number): Date {
    // Exponential backoff: 1min, 2min, 4min, 8min, 16min
    const delayMinutes = Math.pow(2, retryCount);
    const maxDelay = 60; // Max 60 minutes
    const actualDelay = Math.min(delayMinutes, maxDelay);

    const nextRetry = new Date();
    nextRetry.setMinutes(nextRetry.getMinutes() + actualDelay);
    return nextRetry;
  }

  /**
   * Check if should retry
   */
  static shouldRetry(retryCount: number, maxRetries: number): boolean {
    return retryCount < maxRetries;
  }

  /**
   * Execute with retry
   */
  static async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          // Wait before next retry
          await new Promise((resolve) =>
            setTimeout(resolve, delayMs * Math.pow(2, attempt)),
          );
        }
      }
    }

    throw lastError;
  }
}