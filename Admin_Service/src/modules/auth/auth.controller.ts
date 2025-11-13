// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Put,
  Ip,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  LoginDto,
  AdminUserCreateDto,
  AdminUserUpdateDto,
  AuthResponseDto,
  // 👇 nhớ đã tạo DTO này trong shared/dtos/auth.dto.ts
  LockReasonDto,
} from '../../shared/dtos/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('api/admin/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // -------------------- AUTH --------------------

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
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token', description: 'Cấp access token mới từ refresh token.' })
  @ApiBody({ description: 'Refresh token', schema: { example: { refreshToken: 'eyJ...' } } })
  @ApiOkResponse({ description: 'New access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  // -------------------- ADMIN ACCOUNTS --------------------

  @Get('admins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List admin accounts', description: 'Danh sách tài khoản admin.' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'List of admins' })
  async getAllAdmins(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.authService.getAllAdmins(Number(page) || 1, Number(limit) || 10);
  }

  @Get('admins/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin detail', description: 'Chi tiết 1 admin theo ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'Admin ID' })
  @ApiOkResponse({ description: 'Admin detail' })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  async getAdminById(@Param('id', ParseIntPipe) id: number) {
    return this.authService.getAdminById(id);
  }

  @Post('admins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create admin', description: 'Tạo tài khoản admin mới.' })
  @ApiBody({ type: AdminUserCreateDto })
  @ApiCreatedResponse({ description: 'Admin created' })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async createAdmin(
    @Body() createDto: AdminUserCreateDto,
    @CurrentUser() actor: any,
  ) {
    return this.authService.createAdmin(createDto, actor.id);
  }

  @Put('admins/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update admin', description: 'Cập nhật thông tin admin.' })
  @ApiParam({ name: 'id', type: Number, description: 'Admin ID' })
  @ApiBody({ type: AdminUserUpdateDto })
  @ApiOkResponse({ description: 'Admin updated' })
  @ApiNotFoundResponse({ description: 'Admin not found' })
  async updateAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: AdminUserUpdateDto,
    @CurrentUser() actor: any,
  ) {
    return this.authService.updateAdmin(id, updateDto, actor.id);
  }

  @Post('admins/:id/lock')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock admin', description: 'Khoá tài khoản admin (status=LOCKED).' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: LockReasonDto }) // ✅ hiển thị ô reason trong Swagger
  @ApiOkResponse({ description: 'Admin locked' })
  async lockAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: LockReasonDto,
    @CurrentUser() actor: any,
  ) {
    return this.authService.lockAdmin(id, body.reason, actor.id);
  }

@Post('admins/:id/unlock')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Unlock admin', description: 'Mở khoá tài khoản admin (status=ACTIVE).' })
@ApiParam({ name: 'id', type: Number })
@ApiOkResponse({ description: 'Admin unlocked' })
async unlockAdmin(@Param('id', ParseIntPipe) id: number, @CurrentUser() actor: any) {
  return this.authService.unlockAdmin(id, actor.id);
}
}