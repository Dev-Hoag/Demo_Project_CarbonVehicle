import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiResponse, ApiParam, ApiQuery, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Audit Logs')
@Controller('api/admin/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private auditLogService: AuditLogService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List audit logs', description: 'Lọc theo adminId, resourceType, (tuỳ chọn) resourceId/traceId.' })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 10 })
  @ApiQuery({ name: 'adminId', type: Number, required: false })
  @ApiQuery({ name: 'resourceType', type: String, required: false, example: 'USER' })
  @ApiOkResponse({ description: 'List of audit logs' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('adminId') adminId?: number,
    @Query('resourceType') resourceType?: string,
  ) {
    return this.auditLogService.findAll(page, limit, { adminId, resourceType });
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Audit log detail', description: 'Xem chi tiết 1 bản ghi audit.' })
  @ApiParam({ name: 'id', type: Number, description: 'Audit log ID' })
  @ApiOkResponse({ description: 'Audit log detail' })
  async findById(@Param('id') id: number) {
    return this.auditLogService.findById(id);
  }
}
