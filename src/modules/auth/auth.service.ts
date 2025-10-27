import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';
import { RegisterDto, LoginDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from '../../shared/dtos/auth.dto';
import { UserStatus } from '../../shared/enums/user.enums';
import { ConfigService } from '@nestjs/config';
import { type StringValue } from 'ms';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService, // Thêm
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.userRepo.save({
      email: dto.email,
      passwordHash,
      userType: dto.userType,
      status: UserStatus.PENDING,
      isVerified: false, // Thêm: Chưa verify
    });

    await this.profileRepo.save({
      userId: user.id,
      fullName: dto.fullName,
      phone: dto.phone,
    });

    // Tạo verification token
    const verificationToken = this.jwtService.sign({ sub: user.id }, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h' as StringValue,
    });

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await this.userRepo.save(user);

    // Gửi email
    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    return { message: 'Registration successful. Please check your email to verify.' };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Email not verified. Please check your inbox.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Account suspended');
    }

    user.lastLoginAt = new Date();
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }
      if (!user.isVerified) {
        throw new UnauthorizedException('Email not verified');
      }
      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const profile = await this.profileRepo.findOne({ where: { userId } });

    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      status: user.status,
      kycStatus: user.kycStatus,
      isVerified: user.isVerified, // Thêm
      fullName: profile?.fullName,
      phone: profile?.phone,
      createdAt: user.createdAt,
    };
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, { secret: this.configService.get<string>('JWT_SECRET') });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user || user.verificationToken !== token || user.verificationTokenExpires < new Date()) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      user.isVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpires = null;
      user.status = UserStatus.ACTIVE;
      await this.userRepo.save(user);

      return { message: 'Email verified successfully. You can now login.' };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent.' }; // Không leak info
    }

    const resetToken = this.jwtService.sign({ sub: user.id }, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '1h' as StringValue,
    });

    user.resetToken = resetToken;
    user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepo.save(user);

    await this.emailService.sendResetEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token, { secret: this.configService.get<string>('JWT_SECRET') });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });

      if (!user || user.resetToken !== dto.token || user.resetTokenExpires < new Date()) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      user.passwordHash = await bcrypt.hash(dto.password, 10);
      user.resetToken = null;
      user.resetTokenExpires = null;
      await this.userRepo.save(user);

      return { message: 'Password reset successfully. You can now login.' };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, userType: user.userType };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as StringValue,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as StringValue,
    });

    const profile = await this.profileRepo.findOne({ where: { userId: user.id } });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        fullName: profile?.fullName || '',
        kycStatus: user.kycStatus,
      },
    };
  }
}