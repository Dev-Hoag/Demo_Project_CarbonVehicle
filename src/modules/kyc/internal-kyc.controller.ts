import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { VerifyKycDto } from '../../shared/dtos/kyc.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Internal KYC')
@Controller('internal/kyc')
export class InternalKycController {
  constructor(private readonly kycService: KycService) {}

  private verifyInternalApiKey(apiKey: string) {
    const expectedApiKey = process.env.INTERNAL_API_KEY || 'ccm-internal-secret-2024';
    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }
  }

  @Get('documents/pending')
  @ApiExcludeEndpoint()
  async getPendingDocuments(
    @Headers('x-internal-api-key') apiKey: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    this.verifyInternalApiKey(apiKey);
    return this.kycService.getPendingDocuments(page, limit);
  }

  @Get('documents')
  @ApiExcludeEndpoint()
  async getAllDocuments(
    @Headers('x-internal-api-key') apiKey: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    this.verifyInternalApiKey(apiKey);
    return this.kycService.getAllDocuments(page, limit, status);
  }

  @Get('user/:userId/documents')
  @ApiExcludeEndpoint()
  async getUserDocuments(
    @Headers('x-internal-api-key') apiKey: string,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.verifyInternalApiKey(apiKey);
    return this.kycService.getMyDocuments(userId);
  }

  @Get('user/:userId/status')
  @ApiExcludeEndpoint()
  async getUserKycStatus(
    @Headers('x-internal-api-key') apiKey: string,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    this.verifyInternalApiKey(apiKey);
    return this.kycService.getKycStatus(userId);
  }

  @Post('documents/:docId/verify')
  @ApiExcludeEndpoint()
  async verifyDocument(
    @Headers('x-internal-api-key') apiKey: string,
    @Headers('x-admin-id') adminId: string,
    @Param('docId', ParseIntPipe) docId: number,
    @Body() dto: VerifyKycDto,
  ) {
    this.verifyInternalApiKey(apiKey);
    const verifierId = adminId ? parseInt(adminId) : 0;
    return this.kycService.verifyDocument(docId, verifierId, dto);
  }

  @Get('statistics')
  @ApiExcludeEndpoint()
  async getStatistics(@Headers('x-internal-api-key') apiKey: string) {
    this.verifyInternalApiKey(apiKey);
    return this.kycService.getKycStatistics();
  }
}
