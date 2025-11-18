import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout } from 'rxjs';
import { randomUUID } from 'crypto';

export interface ListingCommandResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class ListingServiceClient {
  private readonly logger = new Logger(ListingServiceClient.name);
  private readonly baseUrl: string;
  private readonly enabled: boolean;
  private readonly timeoutMs: number;
  private readonly apiKey?: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.baseUrl = this.config.get<string>('LISTING_SERVICE_URL') || 'http://localhost:3003';
    this.enabled = (this.config.get<string>('LISTING_SERVICE_ENABLED') ?? 'false') === 'true';
    this.timeoutMs = Number(this.config.get<string>('LISTING_SERVICE_TIMEOUT_MS') ?? '10000');
    this.apiKey = this.config.get<string>('LISTING_SERVICE_API_KEY') || undefined;
  }

  private headers(adminId?: number): Record<string, string> {
    const h: Record<string, string> = { 'X-Admin-Request': 'true', 'X-Trace-Id': randomUUID() };
    if (adminId != null) h['X-Admin-User-Id'] = String(adminId);
    if (this.apiKey) h['x-api-key'] = this.apiKey;
    return h;
  }

  private stubOk(tag: string, payload: any, extra?: any): ListingCommandResult {
    this.logger.warn(`[STUB][listing] ${tag} skipped. payload=${JSON.stringify(payload)}`);
    return { success: true, data: { stub: true, tag, ...payload, ...extra } };
  }

  private async get(path: string, params?: Record<string, any>): Promise<ListingCommandResult> {
    try {
      const url = `${this.baseUrl}${path}`;
      const res = await firstValueFrom(
        this.http.get(url, { headers: this.headers(), params }).pipe(timeout(this.timeoutMs)),
      );
      return { success: true, data: res.data };
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const msg = err?.message;
      this.logger.error(`GET ${this.baseUrl}${path} failed. status=${status} data=${JSON.stringify(data)} msg=${msg}`);
      return { success: false, error: data?.message || msg || 'Listing service unavailable' };
    }
  }

  private async post(path: string, body: any, adminId?: number): Promise<ListingCommandResult> {
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
      return { success: false, error: data?.message || msg || 'Listing service unavailable' };
    }
  }

  // ------- Query Operations ----------
  async getListings(page: number, limit: number, filters?: { sellerId?: string; status?: string; listingType?: string }): Promise<ListingCommandResult> {
    // Listing service uses Spring Boot pagination: page (0-indexed), size
    const params: Record<string, any> = {
      page: page - 1, // Convert to 0-indexed
      size: limit,
    };

    if (filters?.sellerId) params.sellerId = filters.sellerId;
    if (filters?.status) params.status = filters.status;
    if (filters?.listingType) params.type = filters.listingType;

    return this.get('/api/v1/listings', params);
  }

  async getListingById(id: string): Promise<ListingCommandResult> {
    return this.get(`/api/v1/listings/${id}`);
  }

  // ------- Commands ----------
  // listingId nên là externalListingId; nếu chưa có thì dùng fallback string (vd: LISTING:123)
  async suspendListing(listingId: string, adminId: number, reason: string): Promise<ListingCommandResult> {
    if (!this.enabled) return this.stubOk('suspend', { listingId, adminUserId: adminId, reason }, { status: 'SUSPENDED' });
    return this.post('/internal/admin/listings/suspend', { listingId, adminUserId: adminId, reason }, adminId);
  }

  async activateListing(listingId: string, adminId: number, reason: string): Promise<ListingCommandResult> {
    if (!this.enabled) return this.stubOk('activate', { listingId, adminUserId: adminId, reason }, { status: 'ACTIVE' });
    return this.post('/internal/admin/listings/activate', { listingId, adminUserId: adminId, reason }, adminId);
  }

  async flagListing(listingId: string, adminId: number, flagType: string, reason: string): Promise<ListingCommandResult> {
    if (!this.enabled) return this.stubOk('flag', { listingId, adminUserId: adminId, flagType, reason }, { flagged: true });
    return this.post('/internal/admin/listings/flag', { listingId, adminUserId: adminId, flagType, reason }, adminId);
  }

  async unflagListing(listingId: string, adminId: number, reason: string): Promise<ListingCommandResult> {
    if (!this.enabled) return this.stubOk('unflag', { listingId, adminUserId: adminId, reason }, { flagged: false });
    return this.post('/internal/admin/listings/unflag', { listingId, adminUserId: adminId, reason }, adminId);
  }
}
