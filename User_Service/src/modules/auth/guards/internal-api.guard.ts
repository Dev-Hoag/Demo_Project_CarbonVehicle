import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * So sánh 2 string an toàn (tránh timing attack)
 */
function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Internal API Guard
 * 
 * Bảo vệ các internal endpoints (service-to-service communication)
 * Require header: x-internal-secret phải khớp với config INTERNAL_API_SECRET
 * Dùng constant-time comparison để tránh timing attack
 */
@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    
    const headerVal =
      req.header('x-internal-secret') ||
      req.header('x-internal-api-key') ||
      req.header('x-internal-key');

    const expected = this.cfg.get<string>('INTERNAL_API_SECRET');

    if (!expected) {
      throw new UnauthorizedException('Internal API not configured');
    }

    if (!headerVal || !safeEqual(headerVal, expected)) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
