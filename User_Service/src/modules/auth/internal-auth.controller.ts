import { Controller, Get, Headers, UnauthorizedException, HttpCode, Logger, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

/**
 * Internal Auth Controller
 * 
 * Controller nội bộ chỉ dành cho API Gateway
 * Gateway sẽ gọi endpoint /internal/auth/verify để verify JWT token
 * 
 * Flow:
 * 1. Client gửi request với Authorization: Bearer <token>
 * 2. Gateway intercept và gọi endpoint này để verify
 * 3. Nếu valid: return user info (userId, role, email) in headers + body
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
   * Return user info nếu token hợp lệ (in HEADERS + body), throw 401 nếu invalid/expired
   */
  @Get('verify')
  @HttpCode(200)
  async verifyToken(
    @Headers('authorization') authorization: string,
    @Res() res: Response
  ) {
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authorization.replace('Bearer ', '').trim();
    
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = this.jwtService.verify(token);

      const userInfo = {
        userId: payload.sub,
        userRole: payload.role || payload.userType,
        email: payload.email,
        userType: payload.userType,
        fullName: payload.fullName || payload.email.split('@')[0]
      };

      // Set headers for nginx auth_request_set to capture
      res.setHeader('X-User-ID', String(userInfo.userId));
      res.setHeader('X-User-Role', userInfo.userRole);
      res.setHeader('X-User-Email', userInfo.email);
      // Encode fullName to prevent "Invalid character in header" error with Vietnamese characters
      res.setHeader('X-User-Name', encodeURIComponent(userInfo.fullName));

      // Also return in body for debugging
      return res.json(userInfo);

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
