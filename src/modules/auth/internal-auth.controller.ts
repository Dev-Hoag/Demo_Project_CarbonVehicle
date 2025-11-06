import { Controller, Get, Headers, UnauthorizedException, HttpCode, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Internal Auth Controller
 * 
 * Controller nội bộ chỉ dành cho API Gateway
 * Gateway sẽ gọi endpoint /internal/auth/verify để verify JWT token
 * 
 * Flow:
 * 1. Client gửi request với Authorization: Bearer <token>
 * 2. Gateway intercept và gọi endpoint này để verify
 * 3. Nếu valid: return user info (userId, role, email)
 * 4. Gateway forward request với user info trong headers (X-User-ID, X-User-Role)
 * 5. Nếu invalid: throw 401, Gateway reject request
 */
@Controller('internal/auth')
export class InternalAuthController {
  private readonly logger = new Logger(InternalAuthController.name);

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verify JWT Token
   * 
   * Endpoint được Gateway gọi để verify token trước khi forward request
   * Return user info nếu token hợp lệ, throw 401 nếu invalid/expired
   */
  @Get('verify')
  @HttpCode(200)
  async verifyToken(@Headers('authorization') authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.replace('Bearer ', '').trim();
    
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = this.jwtService.verify(token);

      return {
        userId: payload.sub,
        userRole: payload.role,
        email: payload.email,
        userType: payload.userType
      };

    } catch (error) {
      this.logger.error(`JWT verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Health check cho internal service
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service-internal-auth' };
  }
}
