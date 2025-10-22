// src/modules/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../shared/entities/admin-user.entity';
import { AdminUserStatus } from '../../shared/enums/admin.enums';
import * as bcrypt from 'bcrypt';
import { LoginDto, AdminUserCreateDto, AuthResponseDto } from '../../shared/dtos/auth.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AdminUser)
    private adminUserRepository: Repository<AdminUser>,
    private jwtService: JwtService,
    private auditLogService: AuditLogService,
  ) {}

  async login(loginDto: LoginDto, ipAddress: string): Promise<AuthResponseDto> {
    // do passwordHash select=false, nên phải addSelect khi login
    const user = await this.adminUserRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.username = :username', { username: loginDto.username })
      .getOne();

    if (!user) throw new UnauthorizedException('Invalid username or password');

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid username or password');
    if (user.status === AdminUserStatus.LOCKED) throw new UnauthorizedException('Account is locked');
    if (user.status === AdminUserStatus.INACTIVE) throw new UnauthorizedException('Account is inactive');

    user.lastLoginAt = new Date();
    await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      adminUserId: user.id,
      actionName: 'LOGIN',
      resourceType: 'AUTH',
      resourceId: user.id.toString(),
      description: 'Admin user logged in',
      ipAddress,
    });

    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
    };

    const accessTtl = Number(process.env.ACCESS_TOKEN_TTL ?? 3600);        // giây
    const refreshTtl = Number(process.env.REFRESH_TOKEN_TTL ?? 604800);    // giây

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: accessTtl }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: refreshTtl }),
      user: payload,
    };
  }

  async validateUser(payload: any) {
    const user = await this.adminUserRepository.findOne({ where: { id: payload.id } });
    if (!user || user.status !== AdminUserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }
    return user;
  }

  async createAdmin(createDto: AdminUserCreateDto, actorId: number): Promise<AdminUser> {
    const existing = await this.adminUserRepository.findOne({
      where: [{ username: createDto.username }, { email: createDto.email }],
    });
    if (existing) throw new ConflictException('Username or email already exists');

    const passwordHash = await bcrypt.hash(createDto.password, 10);
    const user = this.adminUserRepository.create({
      username: createDto.username,
      email: createDto.email,
      passwordHash,
      fullName: createDto.fullName,
      isSuperAdmin: true,
      status: AdminUserStatus.ACTIVE,
    });
    const saved = await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      adminUserId: actorId,
      actionName: 'CREATE_ADMIN',
      resourceType: 'ADMIN',
      resourceId: String(saved.id),
      description: `Admin created`,
      newValue: { username: saved.username, email: saved.email, fullName: saved.fullName },
    });

    return saved;
  }

  async getAllAdmins(page = 1, limit = 10) {
    const [data, total] = await this.adminUserRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      // Nhờ select=false cho passwordHash nên an toàn, nhưng để chắc,
      // bạn có thể map ra DTO gọn nếu muốn.
    });

    // Trả DTO gọn (tránh lộ field nội bộ nếu sau này có thêm)
    const safe = data.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      isSuperAdmin: u.isSuperAdmin,
      status: u.status,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return { data: safe, total, page, limit };
  }

  async getAdminById(id: number) {
    const user = await this.adminUserRepository.findOne({ where: { id } });
    if (!user) throw new BadRequestException('Admin user not found');
    return user;
  }

  async updateAdmin(id: number, updateData: any, actorId: number) {
    const user = await this.getAdminById(id);

    if (updateData.email) {
      const existing = await this.adminUserRepository.findOne({ where: { email: updateData.email } });
      if (existing && existing.id !== id) throw new ConflictException('Email already in use');
    }

    const oldValue = { ...user };
    Object.assign(user, updateData);
    const saved = await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      adminUserId: actorId,
      actionName: 'UPDATE_ADMIN',
      resourceType: 'ADMIN',
      resourceId: String(id),
      description: 'Admin profile updated',
      oldValue: { username: oldValue.username, email: oldValue.email, fullName: oldValue.fullName },
      newValue: { username: saved.username, email: saved.email, fullName: saved.fullName },
    });

    return saved;
  }

  async lockAdmin(targetAdminId: number, reason: string, actorId: number) {
    if (targetAdminId === actorId) {
      throw new ForbiddenException('Không thể tự khoá tài khoản của chính mình');
    }

    const user = await this.getAdminById(targetAdminId);
    if (user.status === AdminUserStatus.LOCKED) {
      throw new BadRequestException('Tài khoản đã ở trạng thái LOCKED');
    }

    user.status = AdminUserStatus.LOCKED;
    await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      adminUserId: actorId,
      actionName: 'LOCK_ADMIN',
      resourceType: 'ADMIN',
      resourceId: String(targetAdminId),
      description: `Admin locked: ${reason}`,
    });

    return user;
  }

  async unlockAdmin(targetAdminId: number, actorId: number) {
    const user = await this.getAdminById(targetAdminId);
    if (user.status === AdminUserStatus.ACTIVE) {
      throw new BadRequestException('Tài khoản đã ở trạng thái ACTIVE');
    }

    user.status = AdminUserStatus.ACTIVE;
    await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      adminUserId: actorId,
      actionName: 'UNLOCK_ADMIN',
      resourceType: 'ADMIN',
      resourceId: String(targetAdminId),
      description: 'Admin unlocked',
    });

    return user;
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken); // JwtModule đã có secret từ env
      const user = await this.validateUser(payload);

      const newPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isSuperAdmin: user.isSuperAdmin,
      };

      const accessTtl = Number(process.env.ACCESS_TOKEN_TTL ?? 3600);
      return { accessToken: this.jwtService.sign(newPayload, { expiresIn: accessTtl }) };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
