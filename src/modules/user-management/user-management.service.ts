import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedUser } from '../../shared/entities/managed-user.entity';
import { UserActionAudit } from '../../shared/entities/user-action-audit.entity';
import { ManagedUserStatus, UserType } from '../../shared/enums/admin.enums';
import { CreateManagedUserDto, UpdateManagedUserDto, ManagedUserResponseDto, UserListResponseDto } from '../../shared/dtos/user-management.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(ManagedUser)
    private managedUserRepository: Repository<ManagedUser>,
    @InjectRepository(UserActionAudit)
    private userActionAuditRepository: Repository<UserActionAudit>,
    private auditLogService: AuditLogService,
  ) {}

  async createUser(createDto: CreateManagedUserDto): Promise<ManagedUserResponseDto> {
    try {
      const user = this.managedUserRepository.create({
        ...createDto,
        status: ManagedUserStatus.ACTIVE,
      });

      const saved = await this.managedUserRepository.save(user);

      await this.auditLogService.log({
        actionName: 'CREATE_USER',
        resourceType: 'USER',
        resourceId: saved.id.toString(),
        description: `Created user: ${createDto.email}`,
        newValue: { email: saved.email, userType: saved.userType },
      });

      return this.toResponseDto(saved);
    } catch (error) {
      throw new BadRequestException('Error creating user');
    }
  }

  async getAllUsers(page: number = 1, limit: number = 10, filters?: any): Promise<UserListResponseDto> {
    const query = this.managedUserRepository.createQueryBuilder('user');

    if (filters?.status) {
      query.where('user.status = :status', { status: filters.status });
    }

    if (filters?.userType) {
      query.andWhere('user.userType = :userType', { userType: filters.userType });
    }

    if (filters?.search) {
      query.andWhere('(user.email LIKE :search OR user.fullName LIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [data, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: data.map((u) => this.toResponseDto(u)),
      total,
      page,
      limit,
    };
  }

  async getUserById(id: number): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return this.toResponseDto(user);
  }

  async updateUser(id: number, updateDto: UpdateManagedUserDto): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const oldValue = { email: user.email, fullName: user.fullName, kycStatus: user.kycStatus };

    Object.assign(user, updateDto);
    const updated = await this.managedUserRepository.save(user);

    await this.auditLogService.log({
      actionName: 'UPDATE_USER',
      resourceType: 'USER',
      resourceId: id.toString(),
      description: `Updated user: ${user.email}`,
      oldValue,
      newValue: updateDto,
    });

    return this.toResponseDto(updated);
  }

  async lockUser(id: number, adminId: number, reason: string): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.status = ManagedUserStatus.LOCKED;
    const updated = await this.managedUserRepository.save(user);

    // Record action audit
await this.userActionAuditRepository.save({
  managedUser: { id } as any,            // ✅ thay vì managedUserId: id
  actionType: 'LOCK',
  performedBy: { id: adminId } as any,   // ✅ thay vì performedBy: adminId (number)
  reason,
});

    // Record general audit
    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'LOCK_USER',
      resourceType: 'USER',
      resourceId: id.toString(),
      description: `Locked user: ${reason}`,
      oldValue: { status: ManagedUserStatus.ACTIVE },
      newValue: { status: ManagedUserStatus.LOCKED },
    });

    return this.toResponseDto(updated);
  }

  async unlockUser(id: number, adminId: number): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.status = ManagedUserStatus.ACTIVE;
    const updated = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
  managedUser: { id } as any,
  actionType: 'UNLOCK',
  performedBy: { id: adminId } as any,
  reason: 'User unlocked by admin',
});


    // Record general audit
    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'UNLOCK_USER',
      resourceType: 'USER',
      resourceId: id.toString(),
      description: 'User unlocked',
      oldValue: { status: ManagedUserStatus.LOCKED },
      newValue: { status: ManagedUserStatus.ACTIVE },
    });

    return this.toResponseDto(updated);
  }

  async suspendUser(id: number, adminId: number, reason: string): Promise<ManagedUserResponseDto> {
    const user = await this.managedUserRepository.findOne({ where: { id } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.status = ManagedUserStatus.SUSPENDED;
    user.suspensionReason = reason;
    const updated = await this.managedUserRepository.save(user);

    await this.userActionAuditRepository.save({
  managedUser: { id } as any,
  actionType: 'SUSPEND',
  performedBy: { id: adminId } as any,
  reason,
});


    // Record general audit
    await this.auditLogService.log({
      adminUserId: adminId,
      actionName: 'SUSPEND_USER',
      resourceType: 'USER',
      resourceId: id.toString(),
      description: `Suspended user: ${reason}`,
      oldValue: { status: user.status },
      newValue: { status: ManagedUserStatus.SUSPENDED, suspensionReason: reason },
    });

    return this.toResponseDto(updated);
  }

  async getUserActionHistory(userId: number, page: number = 1, limit: number = 10) {
    const [data, total] = await this.userActionAuditRepository.findAndCount({
  where: { managedUser: { id: userId } },   // ✅
  order: { createdAt: 'DESC' },
  skip: (page - 1) * limit,
  take: limit,
  // (tuỳ chọn) nếu muốn trả kèm user/admin:
  // relations: ['managedUser', 'performedBy'],
});


    return { data, total, page, limit };
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
  if (!user) throw new BadRequestException('User not found');

  const oldStatus = user.status;                     // <-- giữ lại trước khi đổi

  user.status = ManagedUserStatus.DELETED;
  const updated = await this.managedUserRepository.save(user);

  // Ghi user_action_audit: dùng quan hệ thay vì số FK
  await this.userActionAuditRepository.save({
    managedUser: { id } as any,                      // ✅ thay cho managedUserId: id
    actionType: 'DELETE',
    performedBy: { id: adminId } as any,             // ✅ thay cho performedBy: adminId
    reason,
  });

  // Ghi audit_log: giữ nguyên, nhưng dùng oldStatus đã capture
  await this.auditLogService.log({
    adminUserId: adminId,
    actionName: 'DELETE_USER',
    resourceType: 'USER',
    resourceId: String(id),
    description: `Deleted user: ${reason}`,
    oldValue: { status: oldStatus },                 // ✅ dùng trạng thái trước khi đổi
    newValue: { status: ManagedUserStatus.DELETED },
  });

  return this.toResponseDto(updated);
}

}