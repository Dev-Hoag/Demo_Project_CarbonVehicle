import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,          
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { VerifyKycDto } from '../../shared/dtos/kyc.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Internal KYC')
@ApiBearerAuth()
@Controller('internal/kyc')
@UseGuards(JwtAuthGuard)     
export class InternalKycController {
  constructor(private readonly kycService: KycService) {}

  @Get('user/:userId/documents')
  @ApiExcludeEndpoint()
  async getUserDocuments(@Param('userId', ParseIntPipe) userId: number) {
    return this.kycService.getMyDocuments(userId);
  }

  @Post('documents/:docId/verify')
  @ApiExcludeEndpoint()
  async verifyDocument(
    @Param('docId', ParseIntPipe) docId: number,
    @CurrentUser() verifier: any,
    @Body() dto: VerifyKycDto,
  ) {
    return this.kycService.verifyDocument(docId, verifier.id, dto);
  }
}
