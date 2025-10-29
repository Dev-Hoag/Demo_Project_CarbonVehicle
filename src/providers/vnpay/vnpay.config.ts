// src/modules/providers/vnpay/vnpay.config.ts
import { ConfigService } from '@nestjs/config';

export interface VNPayConfigInterface {
  vnp_TmnCode: string;
  vnp_HashSecret: string;
  vnp_Url: string;
  vnp_ReturnUrl: string;
  vnp_IpnUrl: string;
  vnp_Version: string;
  vnp_Command: string;
  vnp_CurrCode: string;
  vnp_Locale: string;
}

export const loadVNPayConfig = (configService: ConfigService): VNPayConfigInterface => {
  const cfg: VNPayConfigInterface = {
    vnp_TmnCode: configService.get<string>('VNPAY_TMN_CODE', '').trim(),
    vnp_HashSecret: configService.get<string>('VNPAY_HASH_SECRET', '').trim(),
    vnp_Url: configService.get<string>('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    vnp_ReturnUrl: configService.get<string>('VNPAY_RETURN_URL', 'http://localhost:3002/callbacks/vnpay/return'),
    vnp_IpnUrl: configService.get<string>('VNPAY_IPN_URL', 'http://localhost:3002/callbacks/vnpay/ipn'),
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_CurrCode: 'VND',
    vnp_Locale: 'vn',
  };

  if (!cfg.vnp_TmnCode || !cfg.vnp_HashSecret) {
    throw new Error('VNPay config missing: VNPAY_TMN_CODE / VNPAY_HASH_SECRET');
  }
  return cfg;
};
