// src/shared/dtos/internal-user.dto.ts

import {
  IsEnum,
  IsInt,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserStatus } from '../enums/user.enums';

export class UpdateUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status!: UserStatus;

  @ApiProperty({ required: false, example: 'Account verified' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  adminId!: number;
}

export class LockUserDto {
  @ApiProperty({ example: 'Suspicious activity detected' })
  @IsString()
  reason!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  adminId!: number;
}

export class SuspendUserDto {
  @ApiProperty({ example: 'Terms of service violation' })
  @IsString()
  reason!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  adminId!: number;
}

export class BatchGetUsersDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3, 4, 5] })
  @Type(() => Number)
  @IsArray()
  @IsInt({ each: true })
  userIds!: number[];
}

/** POST /internal/users/validate */
export class ValidateUserDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  userId!: number;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  requireKyc?: boolean;
}

/** POST /internal/users/:id/unlock */
export class UnlockUserDto {
  @ApiProperty({ description: 'Admin ID performing the action', example: 1 })
  @Type(() => Number)
  @IsInt()
  adminId!: number;

  @ApiProperty({
    required: false,
    description: 'Optional notes',
    example: 'Verified and safe',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/** POST /internal/users/:id/activate */
export class ActivateUserDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  adminId!: number;

  @ApiProperty({ required: false, example: 'Manual review passed' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/** DELETE /internal/users/:id */
export class SoftDeleteUserDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  adminId!: number;

  @ApiProperty({ example: 'Requested account deletion' })
  @IsString()
  reason!: string;
}
