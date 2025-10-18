import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ManagedUserStatus, UserType, KycStatus } from '../enums/admin.enums';

export class CreateManagedUserDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: UserType, description: 'User type' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiProperty({ description: 'Full name', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ description: 'Phone number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'External user ID', required: false })
  @IsString()
  @IsOptional()
  externalUserId?: string;
}

export class UpdateManagedUserDto {
  @ApiProperty({ description: 'Updated email', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Updated full name', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ description: 'Updated phone', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: KycStatus, description: 'Updated KYC status', required: false })
  @IsEnum(KycStatus)
  @IsOptional()
  kycStatus?: KycStatus;
}

export class LockUserDto {
  @ApiProperty({ description: 'Reason for locking', example: 'Suspicious activity' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class SuspendUserDto {
  @ApiProperty({ description: 'Reason for suspension', example: 'Violation of terms' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class ManagedUserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: number;

  @ApiProperty({ description: 'External user ID' })
  externalUserId: string;

  @ApiProperty({ description: 'Email' })
  email: string;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiProperty({ enum: ManagedUserStatus })
  status: ManagedUserStatus;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Phone' })
  phone: string;

  @ApiProperty({ enum: KycStatus })
  kycStatus: KycStatus;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({ type: [ManagedUserResponseDto] })
  data: ManagedUserResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Limit per page' })
  limit: number;
}