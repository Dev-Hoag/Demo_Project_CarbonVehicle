import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentDto,
  PaymentResponseDto,
  PaymentStatusDto,
} from '../../shared/dtos/payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('api/payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
@Post('initiate')
async initiatePayment(@Body() dto: CreatePaymentDto, @Req() req: Request): Promise<PaymentResponseDto> {
  const ipAddress =
    (req.headers['x-forwarded-for'] as string) ||
    req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'];

  const backendBase = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3002';
  const forcedReturnUrl = `${backendBase}/api/payments/vnpay/callback`;

  return this.paymentService.createPayment(
    { ...dto, returnUrl: forcedReturnUrl },
    ipAddress,
    userAgent,
  );
}


  @Get(':paymentCode/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy trạng thái thanh toán',
    description: 'Kiểm tra trạng thái của payment',
  })
  @ApiParam({
    name: 'paymentCode',
    example: 'PAY_1704067200000_A5F3D9',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment status',
    type: PaymentStatusDto,
  })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(
    @Param('paymentCode') paymentCode: string,
  ): Promise<PaymentStatusDto> {
    return this.paymentService.getPaymentStatus(paymentCode);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lịch sử thanh toán',
    description: 'Lấy danh sách payment của user',
  })
  @ApiResponse({ status: 200, description: 'Payment history' })
  async getPaymentHistory(@Req() req: Request) {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return { payments: [], total: 0, page: 1, limit: 50 };
    }
    return this.paymentService.getPaymentHistory(parseInt(userId));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy chi tiết thanh toán',
    description: 'Lấy thông tin chi tiết của một payment theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const userId = req.headers['x-user-id'] as string;
    return this.paymentService.getPaymentById(parseInt(id), userId ? parseInt(userId) : undefined);
  }
}