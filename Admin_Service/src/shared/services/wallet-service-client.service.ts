import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

export interface WalletCommandResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class WalletServiceClient {
  private readonly logger = new Logger(WalletServiceClient.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly timeoutMs: number;
  private readonly apiKey?: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('WALLET_SERVICE_URL') || 'http://localhost:3002';
    this.enabled = (this.config.get<string>('WALLET_SERVICE_ENABLED') ?? 'false') === 'true';
    this.timeoutMs = Number(this.config.get<string>('WALLET_SERVICE_TIMEOUT_MS') ?? '10000');
    this.apiKey = this.config.get<string>('WALLET_SERVICE_API_KEY') || undefined;
  }

  private headers(adminId?: number): Record<string, string> {
    const h: Record<string, string> = {
      'X-Admin-Request': 'true',
      'X-Trace-Id': randomUUID(),
    };
    if (adminId != null) h['X-Admin-User-Id'] = String(adminId);
    if (this.apiKey) {
      h['x-api-key'] = this.apiKey;
      h['x-internal-api-key'] = this.apiKey; // For internal endpoints
    }
    return h;
  }

  private stubOk(tag: string, payload: any, extra?: any): WalletCommandResult {
    this.logger.warn(`[STUB][wallet] ${tag} skipped. payload=${JSON.stringify(payload)}`);
    return { success: true, data: { stub: true, tag, ...payload, ...extra } };
  }

  private async post(path: string, body: any, adminId?: number): Promise<WalletCommandResult> {
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
      this.logger.error(`POST ${this.baseUrl}${path} failed. status=${status} data=${JSON.stringify(data)} msg=${msg}`);
      return { success: false, error: data?.message || msg || 'Wallet service unavailable' };
    }
  }

  // ---- Commands -------------------------------------------------------------

  // walletTxId: nên là external_transaction_id; nếu chưa có, truyền fallback chuỗi (vd "WALLET_TX:1") như bạn đang làm
  async reverseTransaction(walletTxId: string, adminId: number, reason: string): Promise<WalletCommandResult> {
    if (!this.enabled) {
      return this.stubOk('reverse', { walletTxId, adminUserId: adminId, reason }, { status: 'REVERSED' });
    }
    // Điều chỉnh path cho khớp Wallet Core khi có thật
    return this.post('/internal/admin/wallet-transactions/reverse', { walletTxId, adminUserId: adminId, reason }, adminId);
  }

  async confirmTransaction(walletTxId: string, adminId: number, reason: string): Promise<WalletCommandResult> {
    if (!this.enabled) {
      return this.stubOk('confirm', { walletTxId, adminUserId: adminId, reason }, { status: 'CONFIRMED' });
    }
    return this.post('/internal/admin/wallet-transactions/confirm', { walletTxId, adminUserId: adminId, reason }, adminId);
  }

  async adjustBalance(userId: string, amount: number, adminId: number, reason: string): Promise<WalletCommandResult> {
    if (!this.enabled) {
      return this.stubOk('adjust-balance', { userId, amount, adminUserId: adminId, reason }, { status: 'ADJUSTED' });
    }
    return this.post('/internal/admin/wallet/adjust-balance', { userId, amount, adminUserId: adminId, reason }, adminId);
  }

  // ---- Query Methods --------------------------------------------------------

  async getTransactions(
    page: number = 1,
    limit: number = 50,
    filters?: {
      userId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      minAmount?: number;
      maxAmount?: number;
    },
  ): Promise<any> {
    if (!this.enabled) {
      this.logger.warn('Wallet service disabled, returning empty transaction list');
      return { success: true, data: { items: [], total: 0, page, limit, totalPages: 0 } };
    }

    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (filters?.userId) params.append('userId', filters.userId);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
      if (filters?.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());

      // Use internal endpoint instead of public admin endpoint
      const url = `${this.baseUrl}/internal/admin/transactions?${params.toString()}`;
      const res = await firstValueFrom(this.http.get(url, { headers: this.headers() }).pipe(timeout(this.timeoutMs)));
      return { success: true, data: res.data };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = err?.message;
      this.logger.error(`GET transactions failed. status=${status} data=${JSON.stringify(data)} msg=${msg}`);
      return { success: false, error: data?.message || msg || 'Wallet service unavailable', data: { items: [], total: 0, page, limit, totalPages: 0 } };
    }
  }
}
