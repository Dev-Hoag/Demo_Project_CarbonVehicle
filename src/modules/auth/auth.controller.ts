import {
  Controller, Post, Get, Body, UseGuards, Query, Res, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from '../../shared/dtos/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiQuery({ name: 'token', type: String, required: true })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset link sent if email exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Get('reset-password')
  @ApiOperation({ summary: 'Render reset password form (HTML)' })
  @ApiQuery({ name: 'token', type: String, required: true })
  async renderResetPasswordForm(@Query('token') token: string, @Res() res: Response) {
    if (!token) throw new BadRequestException('Missing token');

    const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>Reset Password</title></head>
<body>
  <h2>Reset Password</h2>
  <form method="POST" action="/api/auth/reset-password">
    <input type="hidden" name="token" value="${encodeURIComponent(token)}" />
    <div>
      <label>New password:</label>
      <input type="password" name="password" required minlength="8" />
    </div>
    <div>
      <label>Confirm password:</label>
      <input type="password" name="confirmPassword" required minlength="8" />
    </div>
    <button type="submit">Change password</button>
  </form>
</body></html>`;
    return res.type('html').send(html);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with token (form/API)' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(
    @Body() dto: ResetPasswordDto & { confirmPassword?: string },
  ) {
    if ((dto as any).confirmPassword !== undefined && (dto as any).confirmPassword !== dto.password) {
      throw new BadRequestException('Passwords do not match');
    }
    return this.authService.resetPassword(dto);
  }
}
