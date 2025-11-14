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
  @ApiQuery({ name: 'resourceType', type: String, required: false })
  @ApiOkResponse({ description: 'List of audit logs' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('adminId') adminId?: number,
    @Query('resourceType') resourceType?: string,
  ) {
    const result = await this.auditLogService.findAll(page, limit, { adminId, resourceType });
    
    // Map response to include adminId and adminUsername
    const mappedData = result.data.map(log => ({
      id: log.id,
      adminId: log.adminUser?.id || null,
      adminUsername: log.adminUser?.username || null,
      actionName: log.actionName,
      targetType: log.resourceType,
      targetId: log.resourceId,
      changes: log.newValue,
      ipAddress: log.ipAddress,
      userAgent: log.traceId,
      createdAt: log.createdAt,
    }));

    return {
      data: mappedData,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Audit log detail', description: 'Xem chi tiết 1 bản ghi audit.' })
  @ApiParam({ name: 'id', type: Number, description: 'Audit log ID' })
  @ApiOkResponse({ description: 'Audit log detail' })
  async findById(@Param('id') id: number) {
    const log = await this.auditLogService.findById(id);
    
    if (!log) {
      return null;
    }

    // Map response to match frontend interface
    return {
      id: log.id,
      adminId: log.adminUser?.id || null,
      adminUsername: log.adminUser?.username || null,
      actionName: log.actionName,
      targetType: log.resourceType,
      targetId: log.resourceId,
      changes: log.newValue,
      ipAddress: log.ipAddress,
      userAgent: log.traceId,
      createdAt: log.createdAt,
    };
  }
}
