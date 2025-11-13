import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * JWT Auth Guard for Payment Service
 * 
 * NOTE: Guard này chỉ check Bearer token có tồn tại, KHÔNG verify signature
 * Lý do: Gateway đã verify JWT trước khi forward request đến service này
 * 
 * TODO: Nếu cần verify đầy đủ, implement như User Service:
 * - Install @nestjs/jwt, @nestjs/passport
 * - Create JwtStrategy với passport
 * - Verify signature và expiration
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }
}
