import { Body, Controller, Get, HttpCode, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OverrideRequestService } from './override-request.service';
import { CreateOverrideRequestDto, ApproveOverrideDto, RejectOverrideDto, ListOverrideQueryDto } from '../../shared/dtos/override-request.dto';

@ApiTags('Override Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/admin/override-requests')
export class OverrideRequestController {
  constructor(private readonly service: OverrideRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create override request' })
  async create(
    @Body() dto: CreateOverrideRequestDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.create({ ...dto, requesterId: admin.id });
  }

  @Post(':id/approve')
  @HttpCode(200)
  @ApiOperation({ summary: 'Approve override request' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveOverrideDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.approve(id, admin.id, dto.comment);
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reject override request' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectOverrideDto,
    @CurrentUser() admin: any,
  ) {
    return this.service.reject(id, admin.id, dto.comment);
  }

  @Get()
  @ApiOperation({ summary: 'List override requests' })
  async list(@Query() q: ListOverrideQueryDto) {
    return this.service.list(q.page, q.limit, q.status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get override request by ID' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.getById(id);
  }
}
