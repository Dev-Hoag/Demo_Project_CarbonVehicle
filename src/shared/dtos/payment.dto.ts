// src/shared/dtos/payment.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { PaymentGateway, PaymentStatus } from '../enums/payment.enums';

export class CreatePaymentDto {
  @ApiProperty({ example: 'TXN_1234567890', description: 'Transaction ID từ Transaction Service' })
  @IsString()
  transactionId: string;

  @ApiProperty({ example: 1, description: 'User ID' })
  @IsNumber()
  @Min(1)
  userId: number;

  @ApiProperty({ enum: PaymentGateway, example: PaymentGateway.VNPAY, description: 'Payment gateway' })
  @IsEnum(PaymentGateway)
  gateway: PaymentGateway;

  @ApiProperty({ example: 100000, description: 'Số tiền thanh toán (VND)', minimum: 10000 })
  @IsNumber()
  @Min(10000)
  amount: number;

  @ApiPropertyOptional({ example: 'Thanh toán mua tín chỉ carbon', description: 'Mô tả đơn hàng' })
  @IsOptional()
  @IsString()
  orderInfo?: string;

  @ApiPropertyOptional({ example: 'NCB', description: 'Mã ngân hàng (VNPay)' })
  @IsOptional()
  @IsString()
  bankCode?: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/payment-result', description: 'URL redirect sau khi thanh toán' })
  @IsOptional()
  @IsString()
  returnUrl?: string;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 'PAY_1234567890_ABC123' })
  paymentCode: string;

  @ApiProperty({ example: 'https://sandbox.vnpayment.vn/paymentv2/...' })
  paymentUrl: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ example: 100000 })
  amount: number;

  @ApiProperty({ example: 'TXN_1234567890' })
  transactionId: string;

  @ApiProperty({ example: '2025-01-01T10:30:00Z' })
  expiredAt: Date;
}

export class PaymentStatusDto {
  @ApiProperty({ example: 'PAY_1234567890_ABC123' })
  paymentCode: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.COMPLETED })
  status: PaymentStatus;

  @ApiProperty({ example: 100000 })
  amount: number;

  @ApiProperty({ example: 'TXN_1234567890' })
  transactionId: string;

  @ApiProperty({ example: '00', required: false })
  gatewayResponseCode?: string;

  @ApiProperty({ example: 'Giao dịch thành công', required: false })
  gatewayResponseMsg?: string;

  @ApiProperty({ example: '2025-01-01T10:45:00Z', required: false })
  completedAt?: Date;
}
