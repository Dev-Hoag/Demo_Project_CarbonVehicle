import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CacheService } from '../../../redis/cache.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check with passport JWT strategy
    const canActivate = await super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // Then check if token is blacklisted
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const isBlacklisted = await this.cacheService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    return true;
  }
}