import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalApiGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers['x-internal-secret'] as string | undefined;
    const expected = process.env.INTERNAL_SECRET || 'super-secret-payment-key';
    if (!header || header !== expected) throw new UnauthorizedException('Invalid internal secret');
    return true;
  }
}
