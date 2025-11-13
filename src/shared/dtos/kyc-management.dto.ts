import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyKycDocumentDto {
  @ApiPropertyOptional({
    description: 'Rejection reason if rejecting the document',
    example: 'Document is not clear or expired',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class KycDocumentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 123 })
  userId: number;

  @ApiProperty({ example: 'ID_CARD' })
  documentType: string;

  @ApiProperty({ example: '001234567890', required: false })
  documentNumber?: string;

  @ApiProperty({ example: '/uploads/kyc/kyc-1699123456789.jpg' })
  fileUrl: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: '2025-11-13T10:30:00.000Z' })
  uploadedAt: Date;

  @ApiProperty({ example: 1, required: false })
  verifiedBy?: number;

  @ApiProperty({ example: '2025-11-13T12:00:00.000Z', required: false })
  verifiedAt?: Date;

  @ApiProperty({ example: 'Document not clear', required: false })
  rejectionReason?: string;

  @ApiPropertyOptional()
  user?: {
    id: number;
    email: string;
    fullName: string;
    userType: string;
  };
}

export class KycDocumentListResponseDto {
  @ApiProperty({ type: [KycDocumentResponseDto] })
  documents: KycDocumentResponseDto[];

  @ApiProperty({ example: 50 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class UserKycStatusResponseDto {
  @ApiProperty({ example: 123 })
  userId: number;

  @ApiProperty({ example: 'PENDING' })
  kycStatus: string;

  @ApiProperty({ type: [KycDocumentResponseDto] })
  documents: KycDocumentResponseDto[];

  @ApiPropertyOptional()
  user?: {
    id: number;
    email: string;
    fullName: string;
    userType: string;
  };
}

export class KycStatisticsDto {
  @ApiProperty({ example: 150 })
  totalDocuments: number;

  @ApiProperty({ example: 45 })
  pendingDocuments: number;

  @ApiProperty({ example: 90 })
  approvedDocuments: number;

  @ApiProperty({ example: 15 })
  rejectedDocuments: number;

  @ApiProperty({ example: 50 })
  totalUsersWithKyc: number;

  @ApiProperty({ example: 20 })
  usersFullyVerified: number;
}
