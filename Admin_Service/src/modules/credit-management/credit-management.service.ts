import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CreditManagementService {
  private readonly logger = new Logger(CreditManagementService.name);
  private readonly creditServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.creditServiceUrl = this.configService.get<string>('CREDIT_SERVICE_URL') || 'http://evowner-credit-service:8093/api';
  }

  /**
   * Get all credit accounts (paginated)
   */
  async getAllCredits(page: number = 0, size: number = 20, sort: string = 'createdAt,desc') {
    try {
      this.logger.log(`Fetching credits from Credit Service: page=${page}, size=${size}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.creditServiceUrl}/v1/credits`, {
          params: { page, size, sort },
        }),
      );

      this.logger.log(`Credits fetched successfully: ${response.data?.content?.length || 0} items`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch credits: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch credit accounts',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get credit account by user ID
   */
  async getCreditByUserId(userId: string) {
    try {
      this.logger.log(`Fetching credit for user: ${userId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.creditServiceUrl}/v1/credits/user/${userId}`),
      );

      this.logger.log(`Credit account found for user ${userId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch credit for user ${userId}: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch credit account',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get credit statistics
   */
  async getStatistics() {
    try {
      this.logger.log('Fetching credit statistics');
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.creditServiceUrl}/v1/credits/statistics`),
      );

      this.logger.log('Credit statistics fetched successfully');
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch credit statistics: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch credit statistics',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Add credits to user account (admin manual adjustment)
   */
  async addCredit(userId: string, amount: number, source: string, description?: string) {
    try {
      this.logger.log(`Admin adding ${amount} credits to user ${userId}, source: ${source}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.creditServiceUrl}/v1/credits/add`, {
          userId,
          amount,
          source,
          description: description || `Admin manual credit addition`,
        }),
      );

      this.logger.log(`Credits added successfully to user ${userId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to add credits to user ${userId}: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to add credits',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Deduct credits from user account (admin manual adjustment)
   */
  async deductCredit(userId: string, amount: number, reason: string, description?: string) {
    try {
      this.logger.log(`Admin deducting ${amount} credits from user ${userId}, reason: ${reason}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.creditServiceUrl}/v1/credits/deduct`, {
          userId,
          amount,
          reason,
          description: description || `Admin manual credit deduction`,
        }),
      );

      this.logger.log(`Credits deducted successfully from user ${userId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to deduct credits from user ${userId}: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to deduct credits',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Transfer credits between users (admin action)
   */
  async transferCredit(fromUserId: string, toUserId: string, amount: number, description?: string) {
    try {
      this.logger.log(`Admin transferring ${amount} credits from user ${fromUserId} to ${toUserId}`);
      
      const response = await firstValueFrom(
        this.httpService.post(`${this.creditServiceUrl}/v1/credits/transfer`, {
          fromUserId,
          toUserId,
          amount,
          description: description || `Admin credit transfer`,
        }),
      );

      this.logger.log(`Credits transferred successfully`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to transfer credits: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to transfer credits',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get credit transactions by user ID
   */
  async getCreditTransactionsByUserId(userId: string, page: number = 0, size: number = 20) {
    try {
      this.logger.log(`Fetching credit transactions for user: ${userId}`);
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.creditServiceUrl}/v1/credit-transactions/user/${userId}`, {
          params: { page, size },
        }),
      );

      this.logger.log(`Credit transactions fetched for user ${userId}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch credit transactions for user ${userId}: ${error.message}`);
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch credit transactions',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
