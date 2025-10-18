import { Controller, Post, Body, UseGuards, Get, Param, Put, Ip } from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery,
  ApiOperation, ApiUnauthorizedResponse, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiBadRequestResponse
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, AdminUserCreateDto, AdminUserUpdateDto, AuthResponseDto } from '../../shared/dtos/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth', 'Admin Accounts')                // ✅ hiển thị dưới 2 nhóm
@Controller('api/admin/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login', description: 'Đăng nhập Admin, trả về access/refresh token.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Successful login', type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async login(@Body() loginDto: LoginDto, @Ip() ipAddress: string) {
    return this.authService.login(loginDto, ipAddress);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'My profile', description: 'Thông tin admin hiện tại (từ JWT).' })
  @ApiOkResponse({ description: 'Current user info' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: any) {
    return user;
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout', description: 'Đăng xuất logic phía client (server chỉ trả message).' })
  @ApiOkResponse({ description: 'Logged out' })
  async logout(@CurrentUser() user: any) {
    return { message: 'Logged out successfully' };
  }

  @Get('admins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List admin accounts', description: 'Danh sách tài khoản admin.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of admins' })
  async getAllAdmins() {
    return this.authService.getAllAdmins();
  }

  @Get('admins/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin detail', description: 'Chi tiết 1 admin theo ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'Admin ID' })
  @ApiOkResponse({ description: 'Admin detail' })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  async getAdminById(@Param('id') id: number) {
    return this.authService.getAdminById(id);
  }

  @Post('admins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin', description: 'Tạo tài khoản admin mới.' })
  @ApiBody({ type: AdminUserCreateDto })
  @ApiCreatedResponse({ description: 'Admin created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async createAdmin(@Body() createDto: AdminUserCreateDto) {
    return this.authService.createAdmin(createDto);
  }

  @Put('admins/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin', description: 'Cập nhật thông tin admin.' })
  @ApiParam({ name: 'id', type: Number, description: 'Admin ID' })
  @ApiBody({ type: AdminUserUpdateDto })
  @ApiOkResponse({ description: 'Admin updated' })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  async updateAdmin(@Param('id') id: number, @Body() updateDto: AdminUserUpdateDto) {
    return this.authService.updateAdmin(id, updateDto);
  }

  @Post('admins/:id/lock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock admin', description: 'Khoá tài khoản admin (status=LOCKED).' })
  @ApiParam({ name: 'id', type: Number, description: 'Admin ID' })
  @ApiBody({
    description: 'Reason for lock',
    schema: { type: 'object', properties: { reason: { type: 'string', example: 'Suspicious' } }, required: ['reason'] },
  })
  @ApiOkResponse({ description: 'Admin locked' })
  async lockAdmin(@Param('id') id: number, @Body() body: { reason: string }) {
    return this.authService.lockAdmin(id, body.reason);
  }

  @Post('admins/:id/unlock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock admin', description: 'Mở khoá tài khoản admin (status=ACTIVE).' })
  @ApiParam({ name: 'id', type: Number, description: 'Admin ID' })
  @ApiOkResponse({ description: 'Admin unlocked' })
  async unlockAdmin(@Param('id') id: number) {
    return this.authService.unlockAdmin(id);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token', description: 'Cấp access token mới từ refresh token.' })
  @ApiBody({ description: 'Refresh token', schema: { example: { refreshToken: 'eyJ...' } } })
  @ApiOkResponse({ description: 'New access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }
}
