import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  KycDocumentResponseDto,
  KycDocumentListResponseDto,
  UserKycStatusResponseDto,
  KycStatisticsDto,
} from '../../shared/dtos/kyc-management.dto';

@Injectable()
export class KycManagementService {
  private readonly userServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userServiceUrl =
      this.configService.get<string>('USER_SERVICE_URL') ||
      'http://user_service_app:3001';
    this.internalApiKey =
      this.configService.get<string>('INTERNAL_API_KEY') ||
      'ccm-internal-secret-2024';
  }

  /**
   * Get all pending KYC documents
   */
  async getPendingDocuments(
    page: number = 1,
    limit: number = 10,
  ): Promise<KycDocumentListResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/internal/kyc/documents/pending`,
          {
            params: { page, limit },
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch pending documents',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all KYC documents with optional status filter
   */
  async getAllDocuments(
    page: number = 1,
    limit: number = 10,
    status?: string,
  ): Promise<KycDocumentListResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/internal/kyc/documents`, {
          params: { page, limit, status },
          headers: {
            'x-internal-api-key': this.internalApiKey,
          },
        }),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch documents',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's KYC documents
   */
  async getUserDocuments(userId: number): Promise<KycDocumentResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/internal/kyc/user/${userId}/documents`,
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch user documents',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's KYC status
   */
  async getUserKycStatus(userId: number): Promise<UserKycStatusResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/internal/kyc/user/${userId}/status`,
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch user KYC status',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verify (approve/reject) a KYC document
   */
  async verifyDocument(
    docId: number,
    adminId: number,
    dto: { approve: boolean; rejectionReason?: string },
  ): Promise<KycDocumentResponseDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.userServiceUrl}/internal/kyc/documents/${docId}/verify`,
          dto,
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
              'x-admin-id': adminId.toString(),
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to verify document',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get KYC statistics
   */
  async getKycStatistics(): Promise<KycStatisticsDto> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.userServiceUrl}/internal/kyc/statistics`,
          {
            headers: {
              'x-internal-api-key': this.internalApiKey,
            },
          },
        ),
      );

      return response.data;
    } catch (error: any) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch statistics',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
