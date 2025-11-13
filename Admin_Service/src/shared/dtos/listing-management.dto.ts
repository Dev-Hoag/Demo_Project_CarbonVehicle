import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingStatus, ListingType } from '../enums/admin.enums';

export class FilterListingDto {
  @ApiPropertyOptional({ enum: ListingStatus })
  @IsEnum(ListingStatus)
  @IsOptional()
  status?: ListingStatus;

  @ApiPropertyOptional({ enum: ListingType })
  @IsEnum(ListingType)
  @IsOptional()
  listingType?: ListingType;

  @ApiPropertyOptional({ example: 'user-123' })
  @IsString()
  @IsOptional()
  ownerId?: string;
}

export class SuspendListingDto {
  @ApiProperty({ example: 'Violates terms of service' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ActivateListingDto {
  @ApiProperty({ example: 'Issue resolved' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class FlagListingDto {
  @ApiProperty({ example: 'FRAUD' })
  @IsString()
  @IsNotEmpty()
  flagType: string;

  @ApiProperty({ example: 'Suspicious activity detected' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class UnflagListingDto {
  @ApiProperty({ example: 'False positive' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
