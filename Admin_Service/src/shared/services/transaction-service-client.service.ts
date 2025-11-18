// src/shared/services/transaction-service-client.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

export interface TransactionCommandResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class TransactionServiceClient {
  private readonly logger = new Logger(TransactionServiceClient.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly apiKey?: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('TRANSACTION_SERVICE_URL') || 'http://localhost:3001';
    this.enabled = (this.config.get<string>('TRANSACTION_SERVICE_ENABLED') ?? 'false') === 'true';
    this.apiKey = this.config.get<string>('TRANSACTION_SERVICE_API_KEY') || undefined;
    this.timeoutMs = Number(this.config.get<string>('TRANSACTION_SERVICE_TIMEOUT_MS') ?? '10000');
  }

  private headers(adminId?: number): Record<string, string> {
    const h: Record<string, string> = {
      'X-Admin-Request': 'true',
      'X-Trace-Id': randomUUID(),
    };
    if (adminId !== undefined) h['X-Admin-User-Id'] = String(adminId);
    if (this.apiKey) h['x-api-key'] = this.apiKey;
    return h;
  }

  private stubOk(tag: string, payload: any, extra?: any): TransactionCommandResult {
    this.logger.warn(`[STUB] ${tag} skipped. payload=${JSON.stringify(payload)}`);
    return { success: true, data: { stub: true, tag, ...payload, ...extra } };
  }

  private async post(path: string, body: any, adminId?: number): Promise<TransactionCommandResult> {
    try {
      const url = `${this.baseUrl}${path}`;
      const res = await firstValueFrom(
        this.http.post(url, body, { headers: this.headers(adminId) }).pipe(timeout(this.timeoutMs)),
      );
      return { success: true, data: res.data };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = err?.message;
      this.logger.error(
        `POST ${this.baseUrl}${path} failed. status=${status} data=${JSON.stringify(data)} msg=${msg}`,
      );
      return {
        success: false,
        error: data?.message || msg || 'Transaction service unavailable',
      };
    }
  }

  // ---- Query Methods --------------------------------------------------------

  async getTransactions(
    page: number = 1,
    limit: number = 50,
    filters?: {
      status?: string;
      buyerId?: string;
      sellerId?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<any> {
    if (!this.enabled) {
      this.logger.warn('Transaction service disabled, returning empty transaction list');
      return { success: true, data: { items: [], total: 0, page, limit, totalPages: 0 } };
    }

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.buyerId) params.append('buyerId', filters.buyerId);
      if (filters?.sellerId) params.append('sellerId', filters.sellerId);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);

      const url = `${this.baseUrl}/api/transactions?${params.toString()}`;
      const res = await firstValueFrom(this.http.get(url, { headers: this.headers() }).pipe(timeout(this.timeoutMs)));
      
      // Transaction service returns: { items, total, page, limit, totalPages }
      return { success: true, data: res.data };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = err?.message;
      this.logger.error(`GET transactions failed. status=${status} data=${JSON.stringify(data)} msg=${msg}`);
      return { success: false, error: data?.message || msg || 'Transaction service unavailable', data: { items: [], total: 0, page, limit, totalPages: 0 } };
    }
  }

  async getTransactionById(id: string): Promise<TransactionCommandResult> {
    if (!this.enabled) {
      return this.stubOk('get-transaction', { id }, { status: 'STUB' });
    }

    try {
      const url = `${this.baseUrl}/api/transactions/${id}`;
      const res = await firstValueFrom(this.http.get(url, { headers: this.headers() }).pipe(timeout(this.timeoutMs)));
      return { success: true, data: res.data };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = err?.message;
      this.logger.error(`GET transaction ${id} failed. status=${status} data=${JSON.stringify(data)} msg=${msg}`);
      return { success: false, error: data?.message || msg || 'Transaction service unavailable' };
    }
  }

  // ---- Commands -------------------------------------------------------------

  async confirmTransaction(
    transactionId: string, // Nên là external_transaction_id (vd: "TXN_001")
    adminId: number,
    reason: string,
  ): Promise<TransactionCommandResult> {
    if (!this.enabled) {
      return this.stubOk('confirm', { transactionId, adminUserId: adminId, reason }, { status: 'CONFIRMED' });
    }
    return this.post('/internal/admin/transactions/confirm', { transactionId, adminUserId: adminId, reason }, adminId);
  }

  async cancelTransaction(transactionId: string, adminId: number, reason: string): Promise<TransactionCommandResult> {
    if (!this.enabled) {
      return this.stubOk('cancel', { transactionId, adminUserId: adminId, reason }, { status: 'CANCELLED' });
    }
    return this.post('/internal/admin/transactions/cancel', { transactionId, adminUserId: adminId, reason }, adminId);
  }

  async refundTransaction(transactionId: string, adminId: number, amount: number, reason: string): Promise<TransactionCommandResult> {
    if (!this.enabled) {
      return this.stubOk('refund', { transactionId, adminUserId: adminId, amount, reason }, { status: 'REFUNDED' });
    }
    return this.post('/internal/admin/transactions/refund', { transactionId, adminUserId: adminId, amount, reason }, adminId);
  }

  async resolveDispute(
    transactionId: string,
    adminId: number,
    resolution: string,
    reason: string,
  ): Promise<TransactionCommandResult> {
    if (!this.enabled) {
      return this.stubOk(
        'resolve-dispute',
        { transactionId, adminUserId: adminId, resolution, reason },
        { status: 'RESOLVED', resolution },
      );
    }
    return this.post(
      '/internal/admin/transactions/resolve-dispute',
      { transactionId, adminUserId: adminId, resolution, reason },
      adminId,
    );
  }
}
