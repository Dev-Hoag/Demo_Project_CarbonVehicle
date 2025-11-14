import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Delete } from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiResponse, ApiBody, ApiParam, ApiQuery,
  ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiBadRequestResponse, ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { UserManagementService } from './user-management.service';
import {
  CreateManagedUserDto, UpdateManagedUserDto, LockUserDto, SuspendUserDto,
  ManagedUserResponseDto, UserListResponseDto
} from '../../shared/dtos/user-management.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ManagedUserStatus, UserType } from '../../shared/enums/admin.enums';

@ApiTags('Users')
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard)
export class UserManagementController {
  constructor(private userService: UserManagementService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users', description: 'Mặc định ẩn user đã DELETED. Dùng includeDeleted=true để hiển thị.' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'status', enum: ManagedUserStatus, required: false })
  @ApiQuery({ name: 'userType', enum: UserType, required: false })
  @ApiQuery({ name: 'search', type: String, required: false, description: 'Tìm theo email/fullName (LIKE)' })
  @ApiQuery({ name: 'includeDeleted', type: Boolean, required: false, example: false })
  @ApiOkResponse({ description: 'List of users', type: UserListResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getAllUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: ManagedUserStatus,
    @Query('userType') userType?: UserType,
    @Query('search') search?: string,
    @Query('includeDeleted') includeDeleted?: boolean,
  ) {
    return this.userService.getAllUsers(page, limit, { status, userType, search, includeDeleted });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User detail', description: 'Chi tiết 1 user theo ID.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User detail', type: ManagedUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserById(@Param('id') id: number) {
    return this.userService.getUserById(id);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user', description: 'Tạo user được quản lý bởi Admin Service.' })
  @ApiBody({ type: CreateManagedUserDto })
  @ApiCreatedResponse({ description: 'User created', type: ManagedUserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error' })
  async createUser(@Body() createDto: CreateManagedUserDto) {
    return this.userService.createUser(createDto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user', description: 'Cập nhật thông tin user.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: UpdateManagedUserDto })
  @ApiOkResponse({ description: 'User updated', type: ManagedUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateUser(@Param('id') id: number, @Body() updateDto: UpdateManagedUserDto) {
    return this.userService.updateUser(id, updateDto);
  }

  @Post(':id/lock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock user', description: 'Khoá user (status=LOCKED) và ghi audit.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: LockUserDto })
  @ApiOkResponse({ description: 'User locked', type: ManagedUserResponseDto })
  async lockUser(@Param('id') id: number, @Body() body: LockUserDto, @CurrentUser() admin: any) {
    return this.userService.lockUser(id, admin.id, body.reason);
  }

  @Post(':id/unlock')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlock user', description: 'Mở khoá user (status=ACTIVE) và ghi audit.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User unlocked', type: ManagedUserResponseDto })
  async unlockUser(@Param('id') id: number, @CurrentUser() admin: any) {
    return this.userService.unlockUser(id, admin.id);
  }

  @Post(':id/suspend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Suspend user', description: 'Tạm ngừng user (status=SUSPENDED) kèm lý do.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({ type: SuspendUserDto })
  @ApiOkResponse({ description: 'User suspended', type: ManagedUserResponseDto })
  async suspendUser(@Param('id') id: number, @Body() body: SuspendUserDto, @CurrentUser() admin: any) {
    return this.userService.suspendUser(id, admin.id, body.reason);
  }

  @Post(':id/unsuspend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsuspend user', description: 'Kích hoạt lại user đã bị suspend (status=ACTIVE).' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiOkResponse({ description: 'User activated', type: ManagedUserResponseDto })
  async unsuspendUser(@Param('id') id: number, @CurrentUser() admin: any) {
    return this.userService.activateUser(id, admin.id);
  }

  @Get(':id/action-history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User action history', description: 'Lịch sử thao tác (lock/unlock/suspend/delete) trên user.' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiOkResponse({ description: 'User action history' })
  async getUserActionHistory(@Param('id') id: number, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    return this.userService.getUserActionHistory(id, page, limit);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user (soft)',
    description: 'Soft delete: đổi status=DELETED, **không xoá bản ghi**. Dùng param `?hard=true` (nếu backend hỗ trợ) để hard delete.'
  })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiBody({
    description: 'Reason for deletion',
    schema: { type: 'object', properties: { reason: { type: 'string', example: 'User violation' } }, required: ['reason'] }
  })
  @ApiOkResponse({ description: 'User deleted (soft delete)', type: ManagedUserResponseDto })
  async deleteUser(@Param('id') id: number, @Body() body: { reason: string }, @CurrentUser() admin: any) {
    return this.userService.deleteUser(id, admin.id, body.reason);
  }
}
