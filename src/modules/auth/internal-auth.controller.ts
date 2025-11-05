import { Controller, Get, Headers, UnauthorizedException, HttpCode } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Internal Auth Controller
 * 
 * Controller này KHÔNG public ra ngoài, chỉ dùng nội bộ cho Gateway
 * Gateway sẽ gọi endpoint /internal/auth/verify để kiểm tra JWT token
 * 
 * Flow:
 * 1. Client gửi request với header: Authorization: Bearer <token>
 * 2. Gateway intercept request, gọi endpoint này để verify token
 * 3. Nếu token hợp lệ → trả về user info (userId, role, email)
 * 4. Gateway nhận được user info → forward request đến backend service kèm theo X-User-ID, X-User-Role
 * 5. Nếu token invalid → throw 401 → Gateway trả về 401 cho client
 */
@Controller('internal/auth')
export class InternalAuthController {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Verify JWT Token
   * 
   * Endpoint này được Gateway gọi để verify token trước khi forward request
   * 
   * Request headers cần có:
   * - Authorization: Bearer <jwt_token>
   * 
   * Response:
   * - Status 200: Token hợp lệ
   * - Headers:
   *   - X-User-ID: ID của user
   *   - X-User-Role: Role của user (EV_OWNER, BUYER, CVA)
   *   - X-User-Email: Email của user
   * - Status 401: Token invalid/expired
   */
  @Get('verify')
  @HttpCode(200)
  async verifyToken(@Headers('authorization') authorization: string) {
    // 1. Check xem có Authorization header không
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization header');
    }

    // 2. Extract token từ "Bearer <token>"
    const token = authorization.replace('Bearer ', '').trim();
    
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      // 3. Verify token bằng JwtService
      // Nếu token hợp lệ → trả về payload
      // Nếu token expired/invalid → throw error
      const payload = this.jwtService.verify(token);

      // 4. Trả về user info để Gateway set vào headers
      // Nginx sẽ đọc response body và set vào request headers
      return {
        userId: payload.sub,        // User ID từ JWT payload
        userRole: payload.role,     // Role: EV_OWNER, BUYER, CVA
        email: payload.email,       // Email của user
        userType: payload.userType  // Thêm userType nếu cần
      };

    } catch (error) {
      // Token invalid, expired, hoặc signature không khớp
      console.error('JWT verification failed:', error.message);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Health check cho internal service
   * Gateway có thể dùng để check xem User Service có alive không
   */
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service-internal-auth' };
  }
}
