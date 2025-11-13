import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsJSON, IsInt, Min, MaxLength } from 'class-validator';
import { OverrideRequestStatus } from '../enums/admin.enums';

export class CreateOverrideRequestDto {
  @ApiProperty({ example: 'FORCE_REFUND' })
  @IsString() @IsNotEmpty() requestType: string;

  @ApiProperty({ example: 'TRANSACTION' })
  @IsString() @IsNotEmpty() targetType: string;

  @ApiProperty({ example: '12345' })
  @IsString() @IsNotEmpty() targetId: string;

  @ApiProperty({ example: 'User refunded incorrectly', maxLength: 1000 })
  @IsString() @IsNotEmpty() @MaxLength(1000) reason: string;

  @ApiProperty({ description: 'Arbitrary data', required: false })
  @IsOptional() payload?: any;
}

export class ApproveOverrideDto {
  @ApiProperty({ required: false, example: 'Looks valid' })
  @IsOptional() @IsString() @MaxLength(1000) comment?: string;
}

export class RejectOverrideDto {
  @ApiProperty({ example: 'Invalid evidence' })
  @IsString() @IsNotEmpty() @MaxLength(1000) comment: string;
}

export class ListOverrideQueryDto {
  @ApiProperty({ required: false, enum: OverrideRequestStatus })
  @IsOptional() @IsEnum(OverrideRequestStatus) status?: OverrideRequestStatus;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional() @IsInt() @Min(1) page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional() @IsInt() @Min(1) limit?: number = 10;
}