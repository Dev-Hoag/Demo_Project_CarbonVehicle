import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({
    example: 'PAY_1234567890_ABC123',
    description: 'Payment code cần hoàn tiền',
  })
  @IsString()
  paymentCode: string;

  @ApiProperty({
    example: 100000,
    description: 'Số tiền hoàn (VND)',
  })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiPropertyOptional({
    example: 'Khách hàng yêu cầu hủy giao dịch',
    description: 'Lý do hoàn tiền',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RefundResponseDto {
  @ApiProperty({ example: 'REF_1234567890_XYZ' })
  refundCode: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 100000 })
  amount: number;

  @ApiProperty({ example: 'PAY_1234567890_ABC123' })
  paymentCode: string;
}