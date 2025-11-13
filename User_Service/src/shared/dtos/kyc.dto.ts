import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/user.enums';

export class UploadKycDocumentDto {
  @ApiProperty({ enum: DocumentType })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiPropertyOptional({ example: '001234567890' })
  @IsString()
  @IsOptional()
  documentNumber?: string;
}

export class VerifyKycDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  approve: boolean;

  @ApiPropertyOptional({ example: 'Document is not clear' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
