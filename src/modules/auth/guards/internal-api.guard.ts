// src/modules/auth/guards/internal-api.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

@Injectable()
export class InternalApiGuard implements CanActivate {
  constructor(private readonly cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    // chấp nhận nhiều alias
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
