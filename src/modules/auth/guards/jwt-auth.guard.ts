import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    // TODO: Verify JWT token
    // For now, just check if Bearer token exists
    const token = authHeader.substring(7);

    if (!token) {
      throw new UnauthorizedException('Invalid token');
    }

    // TODO: Decode JWT and attach user to request
    // request.user = decodedUser;

    return true;
  }
}