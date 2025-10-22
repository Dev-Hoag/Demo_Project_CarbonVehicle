import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../shared/entities/audit-log.entity';

// Khai báo input rõ ràng để hỗ trợ adminUserId
type CreateAuditLogInput = {
  adminUserId?: number;              // <-- hỗ trợ truyền id admin
  actionName: string;
  resourceType: string;
  resourceId?: string | null;
  description?: string | null;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string | null;
  traceId?: string | null;
};

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(input: CreateAuditLogInput) {
    try {
      const auditLog = this.auditLogRepository.create({
        actionName: input.actionName,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        description: input.description ?? null,
        oldValue: input.oldValue ?? null,
        newValue: input.newValue ?? null,
        ipAddress: input.ipAddress ?? null,
        traceId: input.traceId ?? null,
        // ✅ gán relation thay vì adminUserId
        adminUser: input.adminUserId ? ({ id: input.adminUserId } as any) : null,
        // ❌ KHÔNG set createdAt, @CreateDateColumn sẽ tự fill
      } as any);
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      console.error('Audit log error', error);
      // tuỳ ý: throw lại hoặc nuốt lỗi
      // throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.adminUser', 'admin'); // ✅ join quan hệ

    if (filters?.adminId) {
      // ✅ filter theo quan hệ
      qb.andWhere('admin.id = :adminId', { adminId: filters.adminId });
      // Hoặc dùng cột DB: qb.andWhere('log.admin_user_id = :adminId', { adminId: filters.adminId });
    }

    if (filters?.resourceType) {
      qb.andWhere('log.resourceType = :resourceType', { resourceType: filters.resourceType });
    }

    if (filters?.actionName) {
      qb.andWhere('log.actionName = :actionName', { actionName: filters.actionName });
    }

    if (filters?.fromDate && filters?.toDate) {
      qb.andWhere('log.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
    }

    const [data, total] = await qb
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: number) {
    // load kèm adminUser nếu cần hiện username trong UI
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['adminUser'],
    });
  }
}
