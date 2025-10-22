import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { OverrideRequest } from '../../shared/entities/override-request.entity';
import { OverrideRequestStatus } from '../../shared/enums/admin.enums';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class OverrideRequestService {
  private readonly logger = new Logger(OverrideRequestService.name);

  constructor(
    @InjectRepository(OverrideRequest)
    private readonly overrideRepo: Repository<OverrideRequest>,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: {
    requestType: string; targetType: string; targetId: string; reason: string; payload?: any; requesterId: number;
  }) {
    const req = this.overrideRepo.create({
      requestType: dto.requestType,
      targetType: dto.targetType,
      targetId: dto.targetId,
      reason: dto.reason,
      payload: dto.payload ?? null,
      requester: { id: dto.requesterId } as any,
      status: OverrideRequestStatus.PENDING,
    });
    const saved = await this.overrideRepo.save(req);

    await this.auditLog.log({
      adminUserId: dto.requesterId,
      actionName: 'CREATE_OVERRIDE_REQUEST',
      resourceType: 'OVERRIDE_REQUEST',
      resourceId: String(saved.id),
      description: `Create override: ${dto.requestType} for ${dto.targetType}:${dto.targetId}`,
      newValue: { requestType: dto.requestType, targetType: dto.targetType, targetId: dto.targetId },
    });

    return saved;
  }

  async approve(id: number, approverId: number, comment?: string) {
    const req = await this.overrideRepo.findOne({ where: { id }, relations: ['requester', 'approver'] });
    if (!req) throw new BadRequestException('Override request not found');
    if (req.status !== OverrideRequestStatus.PENDING) throw new BadRequestException('Request already processed');
    if (req.requesterId === approverId) throw new ForbiddenException('Cannot approve your own request');

    req.status = OverrideRequestStatus.APPROVED;
    req.approver = { id: approverId } as any;
    req.approvedAt = new Date();
    req.resultMessage = comment ?? '';
    await this.overrideRepo.save(req);

    await this.auditLog.log({
      adminUserId: approverId,
      actionName: 'APPROVE_OVERRIDE_REQUEST',
      resourceType: 'OVERRIDE_REQUEST',
      resourceId: String(id),
      description: `Approved override: ${req.requestType}`,
      newValue: { status: OverrideRequestStatus.APPROVED, comment },
    });

    // Thực thi hành động thực tế (tạm thời mock để bạn có thể test)
    await this.executeOverride(req, approverId);

    return req;
  }

  async reject(id: number, approverId: number, comment: string) {
    const req = await this.overrideRepo.findOne({ where: { id }, relations: ['requester', 'approver'] });
    if (!req) throw new BadRequestException('Override request not found');
    if (req.status !== OverrideRequestStatus.PENDING) throw new BadRequestException('Request already processed');

    req.status = OverrideRequestStatus.REJECTED;
    req.approver = { id: approverId } as any;
    req.approvedAt = new Date();
    req.resultMessage = comment;
    await this.overrideRepo.save(req);

    await this.auditLog.log({
      adminUserId: approverId,
      actionName: 'REJECT_OVERRIDE_REQUEST',
      resourceType: 'OVERRIDE_REQUEST',
      resourceId: String(id),
      description: `Rejected override: ${req.requestType}`,
      newValue: { status: OverrideRequestStatus.REJECTED, comment },
    });

    return req;
  }

 async list(page = 1, limit = 10, status?: OverrideRequestStatus) {
  const qb = this.overrideRepo
    .createQueryBuilder('o')
    .leftJoin('o.requester', 'r')
    .leftJoin('o.approver', 'a')
    .select([
      'o.id',
      'o.requestType',
      'o.targetType',
      'o.targetId',
      'o.reason',
      'o.status',
      'o.payload',
      'o.resultMessage',
      'o.createdAt',
      'o.approvedAt',
      'o.completedAt',
      // requester safe fields
      'r.id',
      'r.username',
      'r.fullName',
      // approver safe fields
      'a.id',
      'a.username',
      'a.fullName',
    ])
    .orderBy('o.createdAt', 'DESC')
    .skip((page - 1) * limit)
    .take(limit);

  if (status) qb.where('o.status = :status', { status });

  const [rows, total] = await qb.getManyAndCount();

  const data = rows.map((o: any) => ({
    id: o.id,
    requestType: o.requestType,
    targetType: o.targetType,
    targetId: o.targetId,
    reason: o.reason,
    status: o.status,
    payload: o.payload,
    resultMessage: o.resultMessage,
    createdAt: o.createdAt,
    approvedAt: o.approvedAt,
    completedAt: o.completedAt,
    requesterId: o.requester?.id ?? null,
    requester: o.requester ? { id: o.requester.id, username: o.requester.username, fullName: o.requester.fullName } : null,
    approverId: o.approver?.id ?? null,
    approver: o.approver ? { id: o.approver.id, username: o.approver.username, fullName: o.approver.fullName } : null,
  }));

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

  async getById(id: number) {
    const req = await this.overrideRepo.findOne({
      where: { id },
      relations: ['requester', 'approver'],
    });
    if (!req) throw new BadRequestException('Override request not found');
    return req;
  }

  private async executeOverride(req: OverrideRequest, approverId: number) {
    try {
      // TODO: nối với Transaction/Wallet/Listings service thật sự
      // Hiện tại mock luôn là thành công để test flow
      this.logger.log(`[MOCK] Executing override ${req.requestType} on ${req.targetType}:${req.targetId}`);

      req.status = OverrideRequestStatus.COMPLETED;
      req.completedAt = new Date();
      req.resultMessage = (req.resultMessage ? req.resultMessage + ' | ' : '') + 'Executed (mock)';
      await this.overrideRepo.save(req);

      await this.auditLog.log({
        adminUserId: approverId,
        actionName: 'EXECUTE_OVERRIDE',
        resourceType: 'OVERRIDE_REQUEST',
        resourceId: String(req.id),
        description: `Executed override (mock): ${req.requestType}`,
        newValue: { status: OverrideRequestStatus.COMPLETED },
      });
    } catch (e: any) {
      req.status = OverrideRequestStatus.FAILED;
      req.resultMessage = `Failed: ${e.message}`;
      await this.overrideRepo.save(req);

      await this.auditLog.log({
        adminUserId: approverId,
        actionName: 'OVERRIDE_FAILED',
        resourceType: 'OVERRIDE_REQUEST',
        resourceId: String(req.id),
        description: `Override failed: ${e.message}`,
        newValue: { status: OverrideRequestStatus.FAILED },
      });
      throw e;
    }
  }
}
