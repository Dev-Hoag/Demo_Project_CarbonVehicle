import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';
import { UserActionLog, UserActionType } from '../../shared/entities/user-action-log.entity';
import { UpdateProfileDto } from '../../shared/dtos/profile.dto';
import { UserStatus, KycStatus } from '../../shared/enums/user.enums';
import {
  UpdateUserStatusDto,
  LockUserDto,
  SuspendUserDto,
} from '../../shared/dtos/internal-user.dto';
import { UserEventPublisher } from '../events/user-event.publisher';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserActionLog)
    private readonly actionLogRepo: Repository<UserActionLog>,
    private readonly eventEmitter: EventEmitter2,
    private readonly userEventPublisher: UserEventPublisher,
  ) {}

  /**
   * Map user và profile thành response DTO
   */
  private toProfileResponse(user: User, profile: UserProfile | null) {
    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      status: user.status,
      kycStatus: user.kycStatus,
      isEmailVerified: user.isVerified,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      phoneNumber: profile?.phone ?? null,
      city: profile?.city ?? null,
      address: profile?.address ?? null,
      dateOfBirth: profile?.dateOfBirth ?? null,
      bio: profile?.bio ?? null,
      // EV Owner fields
      vehicleType: profile?.vehicleType ?? null,
      vehicleModel: profile?.vehicleModel ?? null,
      vehiclePlate: profile?.vehiclePlate ?? null,
      // Buyer fields
      companyName: profile?.companyName ?? null,
      taxCode: profile?.taxCode ?? null,
      // CVA fields
      certificationNumber: profile?.certificationNumber ?? null,
      organizationName: profile?.organizationName ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      passwordChangedAt: user.passwordChangedAt,
    };
  }

  /**
   * Lấy profile của user (cho authenticated user)
   */
  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId },
    });

    console.log('DEBUG getProfile - user data:', {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      isVerified: user.isVerified,
      passwordChangedAt: user.passwordChangedAt,
    });

    return this.toProfileResponse(user, profile);
  }

  /**
   * Update profile của user
   * - User có thể update: fullName, phone, address, bio, v.v.
   * - Fields phụ thuộc userType: vehicleType (EV_OWNER), companyName (BUYER), certificationNumber (CVA)
   * - Log action và emit event
   */
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    let profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.profileRepo.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }

    await this.profileRepo.save(profile);

    // Log action
    await this.logAction(
      userId,
      UserActionType.PROFILE_UPDATED,
      'Profile updated by user',
      userId,
      { updates: dto },
    );

    // Emit event
    this.eventEmitter.emit('user.profile.updated', {
      userId,
      updates: dto,
      updatedAt: new Date(),
    });

    return this.getProfile(userId);
  }

  /**
   * Lấy thông tin user theo ID (public info only)
   * - Chỉ trả về thông tin cơ bản, không bao gồm sensitive data
   */
  async getUserById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId: id },
    });

    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      fullName: profile?.fullName ?? null,
      city: profile?.city ?? null,
      kycStatus: user.kycStatus,
    };
  }

  /**
   * Lấy full user info theo ID (cho internal services)
   * - Bao gồm tất cả thông tin: status, lock, suspend, delete
   * - Dùng cho Admin Service, Payment Service gọi
   */
  async getFullUserById(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const profile = await this.profileRepo.findOne({ where: { userId: id } });

    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      status: user.status,
      kycStatus: user.kycStatus,
      isVerified: user.isVerified,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      city: profile?.city ?? null,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      lockedAt: user.lockedAt,
      lockedBy: user.lockedBy,
      lockReason: user.lockReason,
      suspendedAt: user.suspendedAt,
      suspendedBy: user.suspendedBy,
      suspendReason: user.suspendReason,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
      deleteReason: user.deleteReason,
    };
  }

  /**
   * Lấy user theo email (cho internal services)
   * - Trả về full user data + profile
   */
  async getUserByEmail(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId: user.id },
    });

    return {
      ...user,
      profile,
    };
  }

  /**
   * Validate user status đơn giản (check ACTIVE)
   */
  async validateUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;
    return user.status === UserStatus.ACTIVE;
  }

  /**
   * Validate user với các checks chi tiết
   * - Check: deleted, status, locked, suspended, verified
   * - Có thể require KYC approved
   * - Return { valid, reason } để biết lý do nếu invalid
   */
  async validateUserStatus(userId: number, requireKyc = false) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    
    if (!user) {
      return { valid: false, reason: 'User not found' };
    }

    if (user.deletedAt) {
      return { valid: false, reason: 'User deleted' };
    }

    if (user.status !== UserStatus.ACTIVE) {
      return { valid: false, reason: `User status: ${user.status}` };
    }

    if (user.lockedAt) {
      return { valid: false, reason: 'User locked', lockedAt: user.lockedAt };
    }

    if (user.suspendedAt) {
      return { valid: false, reason: 'User suspended', suspendedAt: user.suspendedAt };
    }

    if (!user.isVerified) {
      return { valid: false, reason: 'Email not verified' };
    }

    if (requireKyc && user.kycStatus !== KycStatus.APPROVED) {
      return { valid: false, reason: 'KYC not approved' };
    }

    return { 
      valid: true, 
      user: await this.getFullUserById(userId) 
    };
  }

  /**
   * Update user status (PENDING, ACTIVE, SUSPENDED, DELETED)
   * - Log action vào user_action_logs
   * - Emit event để các service khác xử lý
   */
  async updateUserStatus(id: number, dto: UpdateUserStatusDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const oldStatus = user.status;
    user.status = dto.status;
    await this.userRepo.save(user);

    // Log action
    await this.logAction(
      id,
      UserActionType.STATUS_CHANGED,
      dto.reason || `Status changed from ${oldStatus} to ${dto.status}`,
      dto.adminId,
      { oldStatus, newStatus: dto.status },
    );

    // Emit event
    this.eventEmitter.emit('user.status.changed', {
      userId: id,
      oldStatus,
      newStatus: dto.status,
      changedBy: dto.adminId,
      changedAt: new Date(),
    });

    return this.getFullUserById(id);
  }

  /**
   * Lock user account (khóa tài khoản)
   * - User không thể login khi bị lock
   * - Lưu thông tin admin lock và lý do
   * - Không thể lock user đã bị deleted
   */
  async lockUser(id: number, dto: LockUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.lockedAt) {
      throw new BadRequestException('User already locked');
    }

    if (user.deletedAt) {
      throw new BadRequestException('Cannot lock deleted user');
    }

    user.lockedAt = new Date();
    user.lockedBy = dto.adminId;
    user.lockReason = dto.reason;
    await this.userRepo.save(user);

    // Log action
    await this.logAction(
      id,
      UserActionType.LOCKED,
      dto.reason,
      dto.adminId,
    );

    // Emit local event
    this.eventEmitter.emit('user.locked', {
      userId: id,
      reason: dto.reason,
      lockedBy: dto.adminId,
      lockedAt: new Date(),
    });

    // Publish event to RabbitMQ for other services
    await this.userEventPublisher.publishUserLocked({
      userId: id,
      email: user.email,
      reason: dto.reason,
      lockedBy: dto.adminId,
      lockedAt: new Date().toISOString(),
    });

    return {
      message: 'User locked successfully',
      user: await this.getFullUserById(id),
    };
  }

  /**
   * Unlock user account (mở khóa tài khoản)
   * - Clear thông tin lock
   * - User có thể login lại
   */
  async unlockUser(id: number, adminId: number, notes?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.lockedAt) {
      throw new BadRequestException('User is not locked');
    }

    user.lockedAt = null;
    user.lockedBy = null;
    user.lockReason = null;
    await this.userRepo.save(user);

    // Log action
    await this.logAction(
      id,
      UserActionType.UNLOCKED,
      notes || 'User unlocked by admin',
      adminId,
    );

    // Emit local event
    this.eventEmitter.emit('user.unlocked', {
      userId: id,
      unlockedBy: adminId,
      unlockedAt: new Date(),
    });

    // Publish event to RabbitMQ
    await this.userEventPublisher.publishUserUnlocked({
      userId: id,
      email: user.email,
      unlockedBy: adminId,
      unlockedAt: new Date().toISOString(),
    });

    return {
      message: 'User unlocked successfully',
      user: await this.getFullUserById(id),
    };
  }

  /**
   * Suspend user account (đình chỉ tài khoản)
   * - Tương tự lock nhưng có thể kèm thời hạn
   * - Dùng cho vi phạm policy, TOS, etc.
   */
  async suspendUser(id: number, dto: SuspendUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.suspendedAt) {
      throw new BadRequestException('User already suspended');
    }

    if (user.deletedAt) {
      throw new BadRequestException('Cannot suspend deleted user');
    }

    user.suspendedAt = new Date();
    user.suspendedBy = dto.adminId;
    user.suspendReason = dto.reason;
    user.status = UserStatus.SUSPENDED;
    await this.userRepo.save(user);

    // Log action
    await this.logAction(
      id,
      UserActionType.SUSPENDED,
      dto.reason,
      dto.adminId,
    );

    // Emit local event
    this.eventEmitter.emit('user.suspended', {
      userId: id,
      reason: dto.reason,
      suspendedBy: dto.adminId,
      suspendedAt: new Date(),
    });

    // Publish event to RabbitMQ
    await this.userEventPublisher.publishUserSuspended({
      userId: id,
      email: user.email,
      reason: dto.reason,
      suspendedBy: dto.adminId,
      suspendedAt: new Date().toISOString(),
    });

    return {
      message: 'User suspended successfully',
      user: await this.getFullUserById(id),
    };
  }

  /**
   * Activate suspended user
   */
  async activateUser(id: number, adminId: number, notes?: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.suspendedAt) {
      throw new BadRequestException('User is not suspended');
    }

    user.suspendedAt = null;
    user.suspendedBy = null;
    user.suspendReason = null;
    user.status = UserStatus.ACTIVE;
    await this.userRepo.save(user);

    // Log action
    await this.logAction(
      id,
      UserActionType.ACTIVATED,
      notes || 'User activated by admin',
      adminId,
    );

    // Emit local event
    this.eventEmitter.emit('user.activated', {
      userId: id,
      activatedBy: adminId,
      activatedAt: new Date(),
    });

    // Publish event to RabbitMQ
    await this.userEventPublisher.publishUserActivated({
      userId: id,
      email: user.email,
      activatedBy: adminId,
      activatedAt: new Date().toISOString(),
    });

    return {
      message: 'User activated successfully',
      user: await this.getFullUserById(id),
    };
  }

  /**
   * Soft delete user account
   * - Không xóa thật trong DB (giữ lại data)
   * - Set deletedAt, status = DELETED
   * - User không thể login, data vẫn query được
   */
  async softDeleteUser(id: number, adminId: number, reason: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (user.deletedAt) {
      throw new BadRequestException('User already deleted');
    }

    user.deletedAt = new Date();
    user.deletedBy = adminId;
    user.deleteReason = reason;
    user.status = UserStatus.DELETED;
    await this.userRepo.save(user);

    // Log action
    await this.logAction(
      id,
      UserActionType.SOFT_DELETED,
      reason,
      adminId,
    );

    // Emit local event
    this.eventEmitter.emit('user.deleted', {
      userId: id,
      reason,
      deletedBy: adminId,
      deletedAt: new Date(),
    });

    // Publish event to RabbitMQ
    await this.userEventPublisher.publishUserDeleted({
      userId: id,
      email: user.email,
      reason,
      deletedBy: adminId,
      deletedAt: new Date().toISOString(),
    });

    return {
      message: 'User deleted successfully',
    };
  }

  /**
   * Batch get users (for Admin Service cache)
   */
  async batchGetUsers(userIds: number[]) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const users = await this.userRepo.find({
      where: { id: In(userIds) },
    });

    const profiles = await this.profileRepo.find({
      where: { userId: In(userIds) },
    });

    return users.map((user) => {
      const profile = profiles.find((p) => p.userId === user.id);
      return {
        id: user.id,
        email: user.email,
        userType: user.userType,
        status: user.status,
        kycStatus: user.kycStatus,
        isVerified: user.isVerified,
        fullName: profile?.fullName ?? null,
        phone: profile?.phone ?? null,
        city: profile?.city ?? null,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lockedAt: user.lockedAt,
        suspendedAt: user.suspendedAt,
        deletedAt: user.deletedAt,
      };
    });
  }

  /**
   * Lấy lịch sử actions của user
   * - Tất cả hành động: lock, unlock, suspend, activate, delete, v.v.
   * - Phân trang với page và limit
   */
  async getUserActionHistory(userId: number, page = 1, limit = 50) {
    const [logs, total] = await this.actionLogRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Log user action vào database
   * - Lưu tất cả actions: lock, unlock, suspend, delete, v.v.
   * - Metadata lưu dạng JSON string
   * - Không throw error nếu log fail (để không ảnh hưởng main flow)
   */
  private async logAction(
    userId: number,
    actionType: UserActionType,
    reason: string,
    performedBy: number,
    metadata?: any,
  ) {
    try {
      const log = this.actionLogRepo.create({
        userId,
        actionType,
        reason,
        performedBy,
        metadata: metadata ? JSON.stringify(metadata) : null,
      });
      await this.actionLogRepo.save(log);
    } catch (error) {
      // Log error but don't throw (action logging shouldn't break main flow)
      this.logger.error(`Failed to log user action: ${error.message}`);
    }
  }
}