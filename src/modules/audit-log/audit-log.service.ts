import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../shared/entities/audit-log.entity';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(logData: Partial<AuditLog>) {
    try {
      const auditLog = this.auditLogRepository.create({
        ...logData,
        createdAt: new Date(),
      });
      return this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log error or throw
      console.error('Audit log error', error);
    }
  }

  async findAll(page: number = 1, limit: number = 10, filters?: any) {
    const query = this.auditLogRepository.createQueryBuilder('log');

    if (filters?.adminId) {
      query.where('log.adminUserId = :adminId', { adminId: filters.adminId });
    }

    if (filters?.resourceType) {
      query.andWhere('log.resourceType = :resourceType', { resourceType: filters.resourceType });
    }

    if (filters?.fromDate && filters?.toDate) {
      query.andWhere('log.createdAt BETWEEN :fromDate AND :toDate', {
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });
    }

    const [data, total] = await query
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: number) {
    return this.auditLogRepository.findOne({ where: { id } });
  }
}