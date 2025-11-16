import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: 'Transaction Service',
      status: 'UP',
      timestamp: new Date().toISOString(),
    };
  }
}
