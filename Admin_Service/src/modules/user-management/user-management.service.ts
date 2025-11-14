import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm'; // 👈 thêm DeepPartial
import { ManagedUser } from '../../shared/entities/managed-user.entity';
import { UserActionAudit } from '../../shared/entities/user-action-audit.entity';
import {
  ManagedUserStatus,
  UserType,
  KycStatus,
} from '../../shared/enums/admin.enums';
import {
  CreateManagedUserDto,
  UpdateManagedUserDto,
  ManagedUserResponseDto,
  UserListResponseDto,
} from '../../shared/dtos/user-management.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminEventPublisher } from '../events/admin-event.publisher';

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(
    @InjectRepository(ManagedUser)
    private readonly managedUserRepository: Repository<ManagedUser>,
    @InjectRepository(UserActionAudit)
    private readonly userActionAuditRepository: Repository<UserActionAudit>,
    private readonly auditLogService: AuditLogService,
    private readonly adminEventPublisher: AdminEventPublisher,
  ) {}

  async createUser(createDto: CreateManagedUserDto): Promise<ManagedUserResponseDto> {
    const email = createDto.email.trim().toLowerCase();
    const userType = createDto.userType as UserType;
    const fullName = createDto.fullName?.trim() || undefined;
    const phone = createDto.phone?.trim() || undefined;
    const externalUserId = createDto.externalUserId?.trim() || undefined;

    try {
      // check trùng
      const existedEmail = await this.managedUserRepository.findOne({ where: { email } });
      if (existedEmail) throw new ConflictException('Email already exists');

      if (externalUserId) {
        const existedExt = await this.managedUserRepository.findOne({ where: { externalUserId } });
        if (existedExt) throw new ConflictException('External user ID already exists');
      }

      // 👇 RẤT QUAN TRỌNG: ép kiểu payload là DeepPartial<ManagedUser>
      const payload: DeepPartial<ManagedUser> = {
        email,
        userType,
        fullName,
        phone,
        externalUserId, // có thể null
        status: ManagedUserStatus.ACTIVE,
        kycStatus: KycStatus.PENDING,
      };

      // 👇 Ép kiểu kết quả là single entity
      const user: ManagedUser = this.managedUserRepository.create(payload);
      const saved: ManagedUser = await this.managedUserRepository.save(user);

      // audit (không để fail API)
      try {
        await this.auditLogService.log({
          actionName: 'CREATE_USER',
          resourceType: 'USER',
          resourceId: String(saved.id),
          description: `Created user: ${saved.email}`,
          newValue: {
            email: saved.email,
            userType: saved.userType,
            externalUserId: saved.externalUserId,
          },
        });
      } catch (auditErr: any) {
        this.logger.warn(
          `audit log failed for CREATE_USER id=${saved.id}: ${auditErr?.message}`,
        );
      }

      return this.toResponseDto(saved);
    } catch (error: any) {
      this.logger.error(`createUser failed: ${error?.message}`, error?.stack);
      const code = error?.code || error?.driverError?.code;
      const msg =
        error?.sqlMessage || error?.driverError?.sqlMessage || error?.message || '';

      if (error instanceof ConflictException) throw error;

      if (code === 'ER_DUP_ENTRY') {
        if (/external_user_id/i.test(msg)) throw new ConflictException('External user ID already exists');
        if (/email/i.test(msg)) throw new ConflictException('Email already exists');
        throw new ConflictException('Duplicate entry');
      }
      if (code === 'ER_BAD_NULL_ERROR') {
        const col = /Column '(.+?)' cannot be null/i.exec(msg)?.[1];
        throw new BadRequestException(`Missing required field${col ? `: ${col}` : ''}`);
      }
      if (code === 'ER_TRUNCATED_WRONG_VALUE' || code === 'ER_WRONG_VALUE_FOR_TYPE') {
        throw new BadRequestException('Invalid value for enum/typed column');
      }

      throw new BadRequestException('Could not create user');
    }
  }

  async getAllUsers(
    page = 1,
    limit = 10,
    filters?: any,
  ): Promise<UserListResponseDto> {
    const qb = this.managedUserRepository.createQueryBuilder('user');

    // ✅ Default: Hide DELETED users unless explicitly requested
    if (!filters?.includeDeleted) {
      qb.where('user.status != :deletedStatus', { deletedStatus: ManagedUserStatus.DELETED });
    }

    // Apply other filters with andWhere to preserve the DELETE filter
    if (filters?.status) {
      qb.andWhere('user.status = :status', { status: filters.status });
    }
    if (filters?.userType) {
      qb.andWhere('user.userType = :userType', { userType: filters.userType });
    }
    if (filters?.search) {
      qb.andWhere('(user.email LIKE :s OR user.fullName LIKE :s)', { s: `%${filters.search}%` });
    }

    const [rows, total] = await qb
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: rows.map((u) => this.toResponseDto(u)), total, page, limit };
  }

  async getUserById(id: number): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.toResponseDto(user);
  }

  async updateUser(id: number, updateDto: UpdateManagedUserDto): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (updateDto.email) {
      const nextEmail = updateDto.email.trim().toLowerCase();
      if (nextEmail !== user.email) {
        const owner = await this.managedUserRepository
          .createQueryBuilder('u')
          .where('u.email = :email', { email: nextEmail })
          .andWhere('u.id != :id', { id })
          .getOne();
        if (owner) throw new ConflictException('Email already exists');
        updateDto.email = nextEmail;
      }
    }

    const oldValue = {
      email: user.email,
      fullName: user.fullName,
      kycStatus: user.kycStatus,
    };

    Object.assign(user, updateDto);

    try {
      const updated: ManagedUser = await this.managedUserRepository.save(user);

      try {
        await this.auditLogService.log({
          actionName: 'UPDATE_USER',
          resourceType: 'USER',
          resourceId: String(id),
          description: `Updated user: ${user.email}`,
          oldValue,
          newValue: updateDto,
        });
      } catch (auditErr: any) {
        this.logger.warn(
          `audit log failed for UPDATE_USER id=${id}: ${auditErr?.message}`,
        );
      }

      // Publish event to sync back to User Service
      if (updated.externalUserId) {
        this.logger.log(`📤 Publishing admin.user.updated for userId=${updated.externalUserId}, email=${updated.email}, phone=${updated.phone}`);
        try {
          await this.adminEventPublisher.publishAdminUserUpdated({
            userId: parseInt(updated.externalUserId),
            email: updated.email,
            fullName: updated.fullName || undefined,
            phone: updated.phone || undefined,
            updatedBy: 'admin', // TODO: get from JWT context
            updatedAt: new Date().toISOString(),
          });
        } catch (eventErr: any) {
          this.logger.error(`❌ Failed to publish admin.user.updated event: ${eventErr.message}`, eventErr.stack);
        }
      } else {
        this.logger.warn(`⚠️ User ${updated.id} has no externalUserId, cannot sync to User Service`);
      }

      return this.toResponseDto(updated);
    } catch (e: any) {
      this.logger.error(`updateUser failed: ${e?.message}`, e?.stack);
      const msg = e?.sqlMessage || e?.message || '';
      if (e?.code === 'ER_DUP_ENTRY') {
        if (/email/i.test(msg)) throw new ConflictException('Email already exists');
        throw new ConflictException('Duplicate entry');
      }
      throw new BadRequestException('Could not update user');
    }
  }

  async lockUser(id: number, adminId: number, reason: string): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.status = ManagedUserStatus.LOCKED;
    const updated: ManagedUser = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
      managedUser: { id } as any,
      actionType: 'LOCK',
      performedBy: { id: adminId } as any,
      reason,
    });

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'LOCK_USER',
      resourceType: 'USER',
      resourceId: String(id),
      description: `Locked user: ${reason}`,
      oldValue: { status: ManagedUserStatus.ACTIVE },
      newValue: { status: ManagedUserStatus.LOCKED },
    });

    // Publish lock event to User Service
    if (updated.externalUserId) {
      try {
        await this.adminEventPublisher.publishAdminUserStatusChanged({
          userId: parseInt(updated.externalUserId),
          email: updated.email,
          action: 'LOCK',
          reason,
          updatedBy: 'admin',
          updatedAt: new Date().toISOString(),
        });
        this.logger.log(`📤 Published admin.user.status_changed: LOCK for userId=${updated.externalUserId}`);
      } catch (err: any) {
        this.logger.error(`❌ Failed to publish lock event: ${err.message}`);
      }
    }

    return this.toResponseDto(updated);
  }

  async unlockUser(id: number, adminId: number): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    user.status = ManagedUserStatus.ACTIVE;
    const updated: ManagedUser = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
      managedUser: { id } as any,
      actionType: 'UNLOCK',
      performedBy: { id: adminId } as any,
      reason: 'User unlocked by admin',
    });

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'UNLOCK_USER',
      resourceType: 'USER',
      resourceId: String(id),
      description: 'User unlocked',
      oldValue: { status: ManagedUserStatus.LOCKED },
      newValue: { status: ManagedUserStatus.ACTIVE },
    });

    // Publish unlock event to User Service
    if (updated.externalUserId) {
      try {
        await this.adminEventPublisher.publishAdminUserStatusChanged({
          userId: parseInt(updated.externalUserId),
          email: updated.email,
          action: 'UNLOCK',
          updatedBy: 'admin',
          updatedAt: new Date().toISOString(),
        });
        this.logger.log(`📤 Published admin.user.status_changed: UNLOCK for userId=${updated.externalUserId}`);
      } catch (err: any) {
        this.logger.error(`❌ Failed to publish unlock event: ${err.message}`);
      }
    }

    return this.toResponseDto(updated);
  }

  async suspendUser(id: number, adminId: number, reason: string): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldStatus = user.status;
    user.status = ManagedUserStatus.SUSPENDED;
    user.suspensionReason = reason;
    const updated: ManagedUser = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
      managedUser: { id } as any,
      actionType: 'SUSPEND',
      performedBy: { id: adminId } as any,
      reason,
    });

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'SUSPEND_USER',
      resourceType: 'USER',
      resourceId: String(id),
      description: `Suspended user: ${reason}`,
      oldValue: { status: oldStatus },
      newValue: { status: ManagedUserStatus.SUSPENDED, suspensionReason: reason },
    });

    // Publish suspend event to User Service
    if (updated.externalUserId) {
      try {
        await this.adminEventPublisher.publishAdminUserStatusChanged({
          userId: parseInt(updated.externalUserId),
          email: updated.email,
          action: 'SUSPEND',
          reason,
          updatedBy: 'admin',
          updatedAt: new Date().toISOString(),
        });
        this.logger.log(`📤 Published admin.user.status_changed: SUSPEND for userId=${updated.externalUserId}`);
      } catch (err: any) {
        this.logger.error(`❌ Failed to publish suspend event: ${err.message}`);
      }
    }

    return this.toResponseDto(updated);
  }

  async activateUser(id: number, adminId: number, notes?: string): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldStatus = user.status;
    user.status = ManagedUserStatus.ACTIVE;
    user.suspensionReason = ''; // Clear suspension reason when activating
    const updated: ManagedUser = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
      managedUser: { id } as any,
      actionType: 'ACTIVATE',
      performedBy: { id: adminId } as any,
      reason: notes || 'User activated by admin',
    });

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'ACTIVATE_USER',
      resourceType: 'USER',
      resourceId: String(id),
      description: notes || 'User activated (unsuspended)',
      oldValue: { status: oldStatus },
      newValue: { status: ManagedUserStatus.ACTIVE },
    });

    // Publish activate event to User Service
    if (updated.externalUserId) {
      try {
        await this.adminEventPublisher.publishAdminUserStatusChanged({
          userId: parseInt(updated.externalUserId),
          email: updated.email,
          action: 'ACTIVATE',
          reason: notes || 'User activated by admin',
          updatedBy: 'admin',
          updatedAt: new Date().toISOString(),
        });
        this.logger.log(`📤 Published admin.user.status_changed: ACTIVATE for userId=${updated.externalUserId}`);
      } catch (err: any) {
        this.logger.error(`❌ Failed to publish activate event: ${err.message}`);
      }
    }

    return this.toResponseDto(updated);
  }

  async getUserActionHistory(userId: number, page = 1, limit = 10) {
    const [data, total] = await this.userActionAuditRepository.findAndCount({
      where: { managedUser: { id: userId } },
      relations: ['performedBy'], // Load admin user who performed the action
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map to safe response DTO
    const mappedData = data.map(audit => ({
      id: audit.id,
      actionType: audit.actionType,
      reason: audit.reason,
      createdAt: audit.createdAt,
      performedBy: audit.performedBy ? {
        id: audit.performedBy.id,
        username: audit.performedBy.username,
        email: audit.performedBy.email,
      } : null,
    }));

    return { data: mappedData, total, page, limit };
  }

  private toResponseDto(user: ManagedUser): ManagedUserResponseDto {
    return {
      id: user.id,
      externalUserId: user.externalUserId,
      email: user.email,
      userType: user.userType,
      status: user.status,
      fullName: user.fullName,
      phone: user.phone,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async deleteUser(id: number, adminId: number, reason: string) {
    const user = await this.managedUserRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldStatus = user.status;

    user.status = ManagedUserStatus.DELETED;
    const updated: ManagedUser = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
      managedUser: { id } as any,
      actionType: 'DELETE',
      performedBy: { id: adminId } as any,
      reason,
    });

    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'DELETE_USER',
      resourceType: 'USER',
      resourceId: String(id),
      description: `Deleted user: ${reason}`,
      oldValue: { status: oldStatus },
      newValue: { status: ManagedUserStatus.DELETED },
    });

    return this.toResponseDto(updated);
  }
}
