import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class VNPayCallbackDto {
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_Version?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_Command?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_TmnCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_Amount?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_CurrCode?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() vnp_TxnRef?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_OrderInfo?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_OrderType?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_Locale?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() vnp_ReturnUrl?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_IpAddr?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() vnp_CreateDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_ExpireDate?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() vnp_BankCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_BankTranNo?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_CardType?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_PayDate?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() vnp_ResponseCode?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_TransactionNo?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_TransactionStatus?: string;

  @ApiPropertyOptional() @IsString() @IsOptional() vnp_SecureHashType?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() vnp_SecureHash?: string;
}

export class WebhookResponseDto {
  @ApiProperty({ example: '00' }) @IsString() RspCode!: string;
  @ApiProperty({ example: 'Confirm Success' }) @IsString() Message!: string;
}
