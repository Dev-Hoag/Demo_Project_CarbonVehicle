import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Param,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { KycService } from './kyc.service';
import { UploadKycDocumentDto } from '../../shared/dtos/kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('KYC')
@ApiBearerAuth()
@Controller('api/kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload KYC document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string', enum: ['ID_CARD', 'PASSPORT', 'DRIVER_LICENSE', 'VEHICLE_REGISTRATION', 'BUSINESS_LICENSE'] },
        documentNumber: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/kyc',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `kyc-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
          return cb(new BadRequestException('Only images and PDFs are allowed!') as any, false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @CurrentUser() user: any,
    @Body() dto: UploadKycDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const fileUrl = `/uploads/kyc/${file.filename}`;
    return this.kycService.uploadDocument(user.id, dto, fileUrl);
  }

  @Get('documents')
  @ApiOperation({ summary: 'Get my KYC documents' })
  async getMyDocuments(@CurrentUser() user: any) {
    return this.kycService.getMyDocuments(user.id);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get my KYC status' })
  async getKycStatus(@CurrentUser() user: any) {
    return this.kycService.getKycStatus(user.id);
  }

  @Delete('documents/:docId')
  @ApiOperation({ summary: 'Delete KYC document' })
  async deleteDocument(@CurrentUser() user: any, @Param('docId', ParseIntPipe) docId: number) {
    return this.kycService.deleteDocument(user.id, docId);
  }
}
