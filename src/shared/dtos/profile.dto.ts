import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Nguyen Hue, District 1' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Ho Chi Minh' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Bio about me...' })
  @IsString()
  @IsOptional()
  bio?: string;

  // EV Owner
  @ApiPropertyOptional({ example: 'VinFast VF8' })
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'VF8 Plus Extended Range' })
  @IsString()
  @IsOptional()
  vehicleModel?: string;

  @ApiPropertyOptional({ example: '51A-12345' })
  @IsString()
  @IsOptional()
  vehiclePlate?: string;

  // Buyer
  @ApiPropertyOptional({ example: 'Green Energy Corp' })
  @IsString()
  @IsOptional()
  companyName?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsString()
  @IsOptional()
  taxCode?: string;

  // CVA
  @ApiPropertyOptional({ example: 'CVA-2024-001' })
  @IsString()
  @IsOptional()
  certificationNumber?: string;

  @ApiPropertyOptional({ example: 'Carbon Verification Ltd.' })
  @IsString()
  @IsOptional()
  organizationName?: string;
}
