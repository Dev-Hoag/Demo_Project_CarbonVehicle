// src/modules/user/internal-user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity, ApiBody } from '@nestjs/swagger';
import { UserService } from './user.service';
import { InternalApiGuard } from '../auth/guards/internal-api.guard';
import {
  UpdateUserStatusDto,
  LockUserDto,
  SuspendUserDto,
  BatchGetUsersDto,
  ValidateUserDto,
  UnlockUserDto,
  ActivateUserDto,
  SoftDeleteUserDto,
} from '../../shared/dtos/internal-user.dto';

@ApiTags('Internal Users')
@ApiSecurity('internalApi') // sẽ hiện ô nhập header x-internal-secret ở /api/docs-internal
@Controller('internal/users')
@UseGuards(InternalApiGuard)
export class InternalUsersController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiOperation({ summary: '[Internal] Get user by ID' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getFullUserById(id);
  }

  @Get('email/:email')
  @ApiOperation({ summary: '[Internal] Get user by email' })
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  @Post('validate')
  @ApiOperation({ summary: '[Internal] Validate user' })
  @ApiBody({
    type: ValidateUserDto,
    examples: { sample: { value: { userId: 1, requireKyc: true } } },
  })
  async validateUser(@Body() dto: ValidateUserDto) {
    if (!dto || dto.userId === undefined || dto.userId === null) {
      throw new BadRequestException('Body must include "userId"');
    }
    return this.userService.validateUserStatus(dto.userId, dto.requireKyc);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '[Internal] Update user status' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(id, dto);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: '[Internal] Lock user' })
  @ApiBody({
    type: LockUserDto,
    examples: { sample: { value: { reason: 'Suspicious activity detected', adminId: 1 } } },
  })
  async lockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LockUserDto,
  ) {
    return this.userService.lockUser(id, dto);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: '[Internal] Unlock user' })
  @ApiBody({
    type: UnlockUserDto,
    examples: { sample: { value: { adminId: 1, notes: 'Verified and safe' } } },
  })
  async unlockUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UnlockUserDto,
  ) {
    if (!dto) throw new BadRequestException('Body is required');
    return this.userService.unlockUser(id, dto.adminId, dto.notes);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: '[Internal] Suspend user' })
  @ApiBody({
    type: SuspendUserDto,
    examples: { sample: { value: { reason: 'Terms of service violation', adminId: 1 } } },
  })
  async suspendUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendUserDto,
  ) {
    return this.userService.suspendUser(id, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '[Internal] Activate user' })
  @ApiBody({
    type: ActivateUserDto,
    examples: { sample: { value: { adminId: 1, notes: 'Manual review passed' } } },
  })
  async activateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActivateUserDto,
  ) {
    if (!dto) throw new BadRequestException('Body is required');
    return this.userService.activateUser(id, dto.adminId, dto.notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: '[Internal] Soft delete user' })
  @ApiBody({
    type: SoftDeleteUserDto,
    examples: { sample: { value: { adminId: 1, reason: 'Requested account deletion' } } },
  })
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SoftDeleteUserDto,
  ) {
    if (!dto) throw new BadRequestException('Body is required');
    return this.userService.softDeleteUser(id, dto.adminId, dto.reason);
  }

  @Post('batch')
  @ApiOperation({ summary: '[Internal] Batch get users' })
  @ApiBody({
    type: BatchGetUsersDto,
    examples: { sample: { value: { userIds: [1, 2, 3, 4, 5] } } },
  })
  async batchGetUsers(@Body() dto: BatchGetUsersDto) {
    return this.userService.batchGetUsers(dto.userIds);
  }

  @Get(':id/action-history')
  @ApiOperation({ summary: '[Internal] Get user action history' })
  async getUserActionHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.userService.getUserActionHistory(id, Number(page), Number(limit));
  }
}
