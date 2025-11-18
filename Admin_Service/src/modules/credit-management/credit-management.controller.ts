import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CreditManagementService } from './credit-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/admin/credits')
@UseGuards(JwtAuthGuard)
export class CreditManagementController {
  constructor(private readonly creditManagementService: CreditManagementService) {}

  /**
   * Get all credit accounts (paginated)
   * GET /api/admin/credits?page=0&size=20&sort=createdAt,desc
   */
  @Get()
  async getAllCredits(
    @Query('page') page: string = '0',
    @Query('size') size: string = '20',
    @Query('sort') sort: string = 'createdAt,desc',
  ) {
    return this.creditManagementService.getAllCredits(
      parseInt(page),
      parseInt(size),
      sort,
    );
  }

  /**
   * Get credit statistics
   * GET /api/admin/credits/statistics
   */
  @Get('statistics')
  async getStatistics() {
    return this.creditManagementService.getStatistics();
  }

  /**
   * Get credit account by user ID
   * GET /api/admin/credits/user/:userId
   */
  @Get('user/:userId')
  async getCreditByUserId(@Param('userId') userId: string) {
    return this.creditManagementService.getCreditByUserId(userId);
  }

  /**
   * Get credit transactions by user ID
   * GET /api/admin/credits/user/:userId/transactions?page=0&size=20
   */
  @Get('user/:userId/transactions')
  async getCreditTransactionsByUserId(
    @Param('userId') userId: string,
    @Query('page') page: string = '0',
    @Query('size') size: string = '20',
  ) {
    return this.creditManagementService.getCreditTransactionsByUserId(
      userId,
      parseInt(page),
      parseInt(size),
    );
  }

  /**
   * Add credits to user account (admin manual adjustment)
   * POST /api/admin/credits/add
   */
  @Post('add')
  @HttpCode(HttpStatus.OK)
  async addCredit(
    @Body()
    body: {
      userId: string;
      amount: number;
      source: string;
      description?: string;
    },
  ) {
    return this.creditManagementService.addCredit(
      body.userId,
      body.amount,
      body.source,
      body.description,
    );
  }

  /**
   * Deduct credits from user account (admin manual adjustment)
   * POST /api/admin/credits/deduct
   */
  @Post('deduct')
  @HttpCode(HttpStatus.OK)
  async deductCredit(
    @Body()
    body: {
      userId: string;
      amount: number;
      reason: string;
      description?: string;
    },
  ) {
    return this.creditManagementService.deductCredit(
      body.userId,
      body.amount,
      body.reason,
      body.description,
    );
  }

  /**
   * Transfer credits between users (admin action)
   * POST /api/admin/credits/transfer
   */
  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  async transferCredit(
    @Body()
    body: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      description?: string;
    },
  ) {
    return this.creditManagementService.transferCredit(
      body.fromUserId,
      body.toUserId,
      body.amount,
      body.description,
    );
  }
}
