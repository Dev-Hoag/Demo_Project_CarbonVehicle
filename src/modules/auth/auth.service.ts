import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
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
    try {
      const user = await this.adminUserRepository.findOne({
        where: { username: loginDto.username },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid username or password');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid username or password');
      }

      if (user.status === AdminUserStatus.LOCKED) {
        throw new UnauthorizedException('Account is locked');
      }

      if (user.status === AdminUserStatus.INACTIVE) {
        throw new UnauthorizedException('Account is inactive');
      }

      // Update last login
      user.lastLoginAt = new Date();
      await this.adminUserRepository.save(user);

      // Log audit
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

      return {
        accessToken: this.jwtService.sign(payload, { expiresIn: '1h' }),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        user: payload,
      };
    } catch (error) {
      throw error;  // Hoặc custom error
    }
  }

  async validateUser(payload: any) {
    const user = await this.adminUserRepository.findOne({
      where: { id: payload.id },
    });

    if (!user || user.status !== AdminUserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async createAdmin(createDto: AdminUserCreateDto): Promise<AdminUser> {
    const existing = await this.adminUserRepository.findOne({
      where: [{ username: createDto.username }, { email: createDto.email }],
    });

    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const user = this.adminUserRepository.create({
      username: createDto.username,
      email: createDto.email,
      passwordHash,
      fullName: createDto.fullName,
      isSuperAdmin: true,
      status: AdminUserStatus.ACTIVE,
    });

    return this.adminUserRepository.save(user);
  }

  async getAllAdmins(page: number = 1, limit: number = 10) {
    const [data, total] = await this.adminUserRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getAdminById(id: number) {
    const user = await this.adminUserRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException('Admin user not found');
    }

    return user;
  }

  async updateAdmin(id: number, updateData: any) {
    const user = await this.getAdminById(id);

    if (updateData.email) {
      const existing = await this.adminUserRepository.findOne({
        where: { email: updateData.email },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateData);
    return this.adminUserRepository.save(user);
  }

  async lockAdmin(id: number, reason: string) {
    const user = await this.getAdminById(id);
    user.status = AdminUserStatus.LOCKED;
    await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      adminUserId: id,
      actionName: 'LOCK_ADMIN',
      resourceType: 'ADMIN',
      resourceId: id.toString(),
      description: `Admin locked: ${reason}`,
    });

    return user;
  }

  async unlockAdmin(id: number) {
    const user = await this.getAdminById(id);
    user.status = AdminUserStatus.ACTIVE;
    await this.adminUserRepository.save(user);

    await this.auditLogService.log({
      actionName: 'UNLOCK_ADMIN',
      resourceType: 'ADMIN',
      resourceId: id.toString(),
      description: 'Admin unlocked',
    });

    return user;
  }
  async refresh(refreshToken: string) {
  try {
    const payload = this.jwtService.verify(refreshToken);
    const user = await this.validateUser(payload);
    const newPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isSuperAdmin: user.isSuperAdmin,
    };
    return {
      accessToken: this.jwtService.sign(newPayload, { expiresIn: '1h' }),
    };
  } catch (error) {
    throw new UnauthorizedException('Invalid refresh token');
  }
}
}
