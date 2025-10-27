import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { UserService } from './user.service';

@ApiTags('Internal')
@Controller('internal/users')
export class InternalUserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @ApiExcludeEndpoint()
  async getUserById(@Param('id') id: number) {
    return this.userService.getProfile(id);
  }

  @Get('email/:email')
  @ApiExcludeEndpoint()
  async getUserByEmail(@Param('email') email: string) {
    return this.userService.getUserByEmail(email);
  }

  @Post('validate')
  @ApiExcludeEndpoint()
  async validateUser(@Body() body: { userId: number }) {
    return { valid: await this.userService.validateUser(body.userId) };
  }
}