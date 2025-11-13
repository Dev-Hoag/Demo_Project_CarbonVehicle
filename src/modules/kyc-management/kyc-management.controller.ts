import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { KycManagementService } from './kyc-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  VerifyKycDocumentDto,
  KycDocumentResponseDto,
  KycDocumentListResponseDto,
  UserKycStatusResponseDto,
} from '../../shared/dtos/kyc-management.dto';

@ApiTags('KYC Management')
@Controller('api/admin/kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycManagementController {
  constructor(private readonly kycManagementService: KycManagementService) {}

  @Get('documents/pending')
  @ApiOperation({
    summary: 'Get all pending KYC documents',
    description: 'List all KYC documents awaiting verification',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiOkResponse({ type: KycDocumentListResponseDto })
  async getPendingDocuments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.kycManagementService.getPendingDocuments(page, limit);
  }

  @Get('documents')
  @ApiOperation({
    summary: 'Get all KYC documents',
    description: 'List all KYC documents with optional status filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
  })
  @ApiOkResponse({ type: KycDocumentListResponseDto })
  async getAllDocuments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.kycManagementService.getAllDocuments(page, limit, status);
  }

  @Get('users/:userId/documents')
  @ApiOperation({
    summary: 'Get user KYC documents',
    description: 'Get all KYC documents for a specific user',
  })
  @ApiParam({ name: 'userId', type: Number })
  @ApiOkResponse({ type: [KycDocumentResponseDto] })
  async getUserDocuments(@Param('userId', ParseIntPipe) userId: number) {
    return this.kycManagementService.getUserDocuments(userId);
  }

  @Get('users/:userId/status')
  @ApiOperation({
    summary: 'Get user KYC status',
    description: 'Get overall KYC verification status for a user',
  })
  @ApiParam({ name: 'userId', type: Number })
  @ApiOkResponse({ type: UserKycStatusResponseDto })
  async getUserKycStatus(@Param('userId', ParseIntPipe) userId: number) {
    return this.kycManagementService.getUserKycStatus(userId);
  }

  @Post('documents/:docId/approve')
  @ApiOperation({
    summary: 'Approve KYC document',
    description: 'Approve a KYC document as verified',
  })
  @ApiParam({ name: 'docId', type: Number })
  @ApiCreatedResponse({ type: KycDocumentResponseDto })
  @ApiBadRequestResponse({ description: 'Document already verified' })
  async approveDocument(
    @Param('docId', ParseIntPipe) docId: number,
    @CurrentUser() admin: any,
  ) {
    return this.kycManagementService.verifyDocument(
      docId,
      admin.id,
      { approve: true },
    );
  }

  @Post('documents/:docId/reject')
  @ApiOperation({
    summary: 'Reject KYC document',
    description: 'Reject a KYC document with reason',
  })
  @ApiParam({ name: 'docId', type: Number })
  @ApiCreatedResponse({ type: KycDocumentResponseDto })
  @ApiBadRequestResponse({ description: 'Document already verified' })
  async rejectDocument(
    @Param('docId', ParseIntPipe) docId: number,
    @Body() dto: VerifyKycDocumentDto,
    @CurrentUser() admin: any,
  ) {
    return this.kycManagementService.verifyDocument(docId, admin.id, {
      approve: false,
      rejectionReason: dto.rejectionReason,
    });
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get KYC statistics',
    description: 'Get statistics about KYC verifications',
  })
  async getKycStatistics() {
    return this.kycManagementService.getKycStatistics();
  }
}
