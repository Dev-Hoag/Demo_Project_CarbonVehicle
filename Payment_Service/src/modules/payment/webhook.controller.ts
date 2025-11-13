// src/modules/payment/webhook.controller.ts
import { Controller, Get, Query, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentService } from './payment.service';
import { PaymentGateway } from '../../shared/entities/payment.entity';
import { CallbackType } from '../../shared/entities/payment-callback.entity';
import { VNPayCallbackDto, WebhookResponseDto } from '../../shared/dtos/webhook.dto';

@ApiTags('webhooks')
@Controller('api/payments')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * VNPay Return URL (user redirect) — Option A1:
   * - Backend verify + cập nhật DB
   * - Nếu có FRONTEND_URL thì redirect 302 sang UI
   * - Nếu KHÔNG có FRONTEND_URL thì trả HTML fallback (lấy thêm field từ query khi DTO không có)
   */
  @Get('vnpay/callback')
  @ApiOperation({
    summary: 'VNPay Return URL',
    description: 'VNPay redirect user về đây sau khi thanh toán',
  })
  async vnpayReturnUrl(@Query() query: VNPayCallbackDto, @Res() res: Response) {
    this.logger.log(`VNPay Return URL received for ${query.vnp_TxnRef}`);

    try {
      const result = await this.paymentService.handleCallback(
        PaymentGateway.VNPAY,
        query,
        CallbackType.RETURN_URL,
        JSON.stringify(query),
      );

      // Chỉ redirect nếu FRONTEND_URL được set (không dùng default)
      const frontend = process.env.FRONTEND_URL;
      if (frontend && frontend.trim()) {
        const url = `${frontend}/payment-result?paymentCode=${encodeURIComponent(
          result.paymentCode,
        )}&status=${encodeURIComponent(result.status)}`;
        return res.redirect(302, url);
      }

      // HTML fallback: dùng thêm query.vnp_* nếu result không có các field này
      const responseCode = (result as any).responseCode ?? query.vnp_ResponseCode ?? '';
      const bankCode = (result as any).bankCode ?? query.vnp_BankCode ?? '';
      const amount = result.amount ?? (query.vnp_Amount ? Number(query.vnp_Amount) / 100 : '');

      return res
        .status(200)
        .send(`
          <!doctype html><meta charset="utf-8"/>
          <style>
            body{font-family:Inter,Arial,sans-serif;max-width:720px;margin:48px auto;padding:16px}
            .card{border:1px solid #e5e7eb;border-radius:12px;padding:24px}
            .kv{background:#f9fafb;border-radius:8px;padding:12px;font-family:ui-monospace,Consolas,monospace}
            .ok{color:#0a7f2e}.fail{color:#b00020}
          </style>
          <h1 class="${result.status === 'COMPLETED' ? 'ok' : 'fail'}">Payment ${result.status}</h1>
          <div class="card">
            <p><b>PaymentCode:</b> ${result.paymentCode}</p>
            <p><b>ResponseCode:</b> ${responseCode}</p>
            <p><b>Amount:</b> ${amount}</p>
            <p><b>Bank:</b> ${bankCode}</p>
          </div>
          <h3>Tip</h3>
          <div class="kv">
            Muốn redirect sang UI: set <code>FRONTEND_URL</code>, ví dụ
            <code>FRONTEND_URL=http://localhost:5173</code> (Vite) hoặc
            <code>http://localhost:3000</code> (CRA/Next).
          </div>
        `);
    } catch (error: any) {
      this.logger.error(`Return URL error: ${error.message}`);

      const frontend = process.env.FRONTEND_URL;
      if (frontend && frontend.trim()) {
        const url = `${frontend}/payment-result?status=error&message=${encodeURIComponent(error.message)}`;
        return res.redirect(302, url);
      }

      // Fallback JSON khi lỗi & chưa có UI
      return res.status(200).json({
        success: false,
        status: 'ERROR',
        message: error.message,
      });
    }
  }

  /**
   * VNPay IPN (server-to-server) — chốt trạng thái ở backend
   */
  @Get('vnpay/ipn')
  @ApiOperation({
    summary: 'VNPay IPN',
    description: 'Endpoint để VNPay gửi IPN (server-to-server)',
  })
  async vnpayIpn(@Query() query: VNPayCallbackDto): Promise<WebhookResponseDto> {
    this.logger.log(`VNPay IPN received for ${query.vnp_TxnRef}`);

    try {
      await this.paymentService.handleCallback(
        PaymentGateway.VNPAY,
        query,
        CallbackType.IPN,
        JSON.stringify(query),
      );

      return { RspCode: '00', Message: 'Confirm Success' };
    } catch (error: any) {
      this.logger.error(`IPN error: ${error.message}`);
      return { RspCode: '99', Message: error.message };
    }
  }
}
