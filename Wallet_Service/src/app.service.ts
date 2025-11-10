// src/app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      service: 'Wallet Service',
      version: '1.0.0',
      description: 'Manage fiat money wallets for Carbon Credit Marketplace',
      port: process.env.PORT || 3008,
      docs: '/api/docs',
    };
  }

  healthCheck(): object {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'wallet-service',
      uptime: process.uptime(),
    };
  }
}
