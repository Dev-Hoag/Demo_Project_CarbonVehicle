// src/modules/providers/vnpay/vnpay.provider.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import moment from 'moment';

import { loadVNPayConfig, VNPayConfigInterface } from './vnpay.config';
import { CryptoUtil } from './../../shared/utils/crypto.util';
import {
  CreatePaymentRequest,
  PaymentResponse,
  CallbackVerifyResult,
  IPaymentProvider,
} from './../../shared/interfaces/payment-provider.interface';

@Injectable()
export class VNPayProvider implements IPaymentProvider {
  private readonly logger = new Logger(VNPayProvider.name);
  private readonly cfg: VNPayConfigInterface;

  constructor(private readonly configService: ConfigService) {
    this.cfg = loadVNPayConfig(this.configService);

    // Log tối thiểu để đối soát nhanh cấu hình
    this.logger.log('=== VNPAY CONFIG ===');
    this.logger.log(`TMN Code: ${this.cfg.vnp_TmnCode}`);
    this.logger.log(`Hash Secret: ${this.cfg.vnp_HashSecret?.substring(0, 10)}...`);
    this.logger.log(`URL: ${this.cfg.vnp_Url}`);
    this.logger.log(`Return URL: ${this.cfg.vnp_ReturnUrl}`);
  }

  /**
   * Helper: remove dấu tiếng Việt để tránh sai khác encode giữa 2 phía
   */
  private removeVietnameseAccents(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  /**
   * Helper: build chuỗi ký theo chuẩn VNPay
   * - Sort ASCII key tăng dần
   * - URL-encode từng key và value
   * - Chuẩn hóa space: %20 -> +
   * - Nối bằng '&'
   */
  private buildSignedData(params: Record<string, string | number>): string {
    const keys = Object.keys(params).sort();

    const encode = (v: string) =>
      encodeURIComponent(v)
        .replace(/%20/g, '+')   // quan trọng: VNPay chuẩn hóa space -> '+'
        .replace(/\(/g, '%28')  // ổn định thêm (không bắt buộc nhưng tốt)
        .replace(/\)/g, '%29')
        .replace(/%7E/g, '~');

    return keys
      .map((k) => `${encode(k)}=${encode(String(params[k]))}`)
      .join('&');
  }

  /**
   * Helper: sort object theo ASCII key
   */
  private sortObject<T extends Record<string, any>>(obj: T): T {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, k) => {
        acc[k] = obj[k];
        return acc;
      }, {}) as T;
  }

  /**
   * Tạo URL thanh toán VNPay
   */
  async createPayment(req: CreatePaymentRequest): Promise<PaymentResponse> {
    try {
      this.logger.log('=== CREATE PAYMENT START ===');
      this.logger.log(`Payment Code: ${req.paymentCode}`);
      this.logger.log(`Amount: ${req.amount}`);
      this.logger.log(`Bank Code: ${req.bankCode || 'N/A'}`);

      const createDate = moment().format('YYYYMMDDHHmmss');
      const expireDate = moment().add(15, 'minutes').format('YYYYMMDDHHmmss');

      // Chuẩn hóa IP (tránh ::1)
      let ipAddr = req.ipAddress || '127.0.0.1';
      if (ipAddr === '::1' || ipAddr.includes('::')) {
        ipAddr = '127.0.0.1';
      }

      // Base params (tất cả là string)
      const baseParams: Record<string, string> = {
        vnp_Version: this.cfg.vnp_Version,
        vnp_Command: this.cfg.vnp_Command,
        vnp_TmnCode: this.cfg.vnp_TmnCode,
        vnp_Locale: this.cfg.vnp_Locale,
        vnp_CurrCode: this.cfg.vnp_CurrCode,
        vnp_TxnRef: req.paymentCode,
        vnp_OrderInfo: this.removeVietnameseAccents(
          req.orderInfo || 'Thanh toan don hang',
        ),
        vnp_OrderType: 'other',
        vnp_Amount: String(Math.round(req.amount * 100)), // amount x100
        vnp_ReturnUrl: req.returnUrl || this.cfg.vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate,
      };

      if (req.bankCode) {
        baseParams.vnp_BankCode = req.bankCode;
      }

      this.logger.log('=== BASE PARAMS (Before Sort) ===');
      this.logger.log(JSON.stringify(baseParams, null, 2));

      // Sort để ký + build signed data (URL-encode từng key=value, space -> '+')
      const sortedParams = this.sortObject(baseParams);

      this.logger.log('=== SORTED PARAMS ===');
      this.logger.log(JSON.stringify(sortedParams, null, 2));

      const signData = this.buildSignedData(sortedParams);

      this.logger.log('=== SIGN DATA (encoded) ===');
      this.logger.log(`Length: ${signData.length}`);
      this.logger.log(`Content: ${signData}`);

      // HMAC SHA512 -> UPPERCASE để so sánh ổn định với VNPay
      const vnp_SecureHash = CryptoUtil
        .createHmacSha512(this.cfg.vnp_HashSecret, signData)
        .toUpperCase();

      this.logger.log('=== SECURE HASH ===');
      this.logger.log(`Hash: ${vnp_SecureHash}`);

      // Build URL redirect: KHÔNG dùng URLSearchParams vì nó encode lại
      // VNPay yêu cầu giữ nguyên format đã encode trong signData
      const finalParams = `${signData}&vnp_SecureHash=${vnp_SecureHash}`;
      const paymentUrl = `${this.cfg.vnp_Url}?${finalParams}`;

      this.logger.log('=== PAYMENT URL ===');
      this.logger.log(paymentUrl);
      this.logger.log('=== CREATE PAYMENT END ===');

      return {
        success: true,
        paymentUrl,
        paymentCode: req.paymentCode,
      } as PaymentResponse;
    } catch (e: any) {
      this.logger.error(`=== CREATE PAYMENT ERROR ===`);
      this.logger.error(e.message);
      this.logger.error(e.stack);
      return { success: false, error: e.message };
    }
  }

  /**
   * Verify VNPay callback/IPN
   */
  verifyCallback(vnpParams: any): CallbackVerifyResult {
    try {
      this.logger.log('=== VERIFY CALLBACK START ===');
      this.logger.log(JSON.stringify(vnpParams, null, 2));

      const receivedHash: string = vnpParams.vnp_SecureHash;

      // Loại bỏ hash khỏi tham số trước khi ký lại
      const paramsToVerify: Record<string, string> = { ...vnpParams };
      delete paramsToVerify.vnp_SecureHash;
      delete paramsToVerify.vnp_SecureHashType;

      const sorted = this.sortObject(paramsToVerify);

      // Re-encode theo đúng quy tắc như khi tạo payment (space -> '+')
      const signData = this.buildSignedData(sorted);
      const calculatedHash = CryptoUtil.createHmacSha512(
        this.cfg.vnp_HashSecret,
        signData,
      ).toUpperCase();

      const isValid =
        (receivedHash || '').toUpperCase() === (calculatedHash || '').toUpperCase();

      this.logger.log(`Hash Valid: ${isValid}`);
      if (!isValid) {
        this.logger.error('=== HASH MISMATCH ===');
        this.logger.error(`Expected: ${calculatedHash}`);
        this.logger.error(`Received: ${receivedHash}`);
        this.logger.error(`ReSignData: ${signData}`);
      }

      this.logger.log('=== VERIFY CALLBACK END ===');

      return {
        isValid,
        paymentCode: vnpParams.vnp_TxnRef,
        responseCode:
          vnpParams.vnp_ResponseCode || vnpParams.vnp_TransactionStatus,
        transactionNo: vnpParams.vnp_TransactionNo,
        amount: Number(vnpParams.vnp_Amount || 0) / 100,
        bankCode: vnpParams.vnp_BankCode,
        payDate: vnpParams.vnp_PayDate,
      };
    } catch (e: any) {
      this.logger.error(`Verify VNPay failed: ${e.message}`);
      this.logger.error(e.stack);
      return {
        isValid: false,
        paymentCode: vnpParams?.vnp_TxnRef ?? 'UNKNOWN',
        responseCode: '99',
        amount: 0,
      };
    }
  }

  /**
   * Map message mã phản hồi
   */
  getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công nhưng nghi ngờ',
      '11': 'Hết hạn chờ thanh toán',
      '24': 'Khách hàng hủy giao dịch',
      '51': 'Không đủ số dư',
      '65': 'Vượt hạn mức',
      '75': 'Ngân hàng bảo trì',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần',
      '97': 'Checksum sai',
      '99': 'Lỗi khác',
    };
    return messages[code] ?? 'Lỗi không xác định';
  }

  isSuccessResponse(code: string): boolean {
    return code === '00';
  }
}

export class PaymentCodeUtil {
  /**
   * Generate payment code
   * Format: PAY_TIMESTAMP_RANDOM
   * Example: PAY_1704067200000_A5F3D9
   */
  static generate(prefix: string = 'PAY'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate refund code
   */
  static generateRefundCode(): string {
    return this.generate('REF');
  }

  /**
   * Generate idempotency key from request
   */
  static generateIdempotencyKey(
    userId: number,
    transactionId: string,
    amount: number,
  ): string {
    const data = `${userId}_${transactionId}_${amount}`;
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Parse payment code to get timestamp
   */
  static getTimestamp(paymentCode: string): number | null {
    try {
      const parts = paymentCode.split('_');
      if (parts.length >= 2) {
        return parseInt(parts[1], 10);
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}
