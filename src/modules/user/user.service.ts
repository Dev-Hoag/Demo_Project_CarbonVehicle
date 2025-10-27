import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';
import { UpdateProfileDto } from '../../shared/dtos/profile.dto';
import { UserStatus } from '../../shared/enums/user.enums'; 

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
  ) {}

  // Helper: map về DTO trả ra
  private toProfileResponse(user: User, profile: UserProfile | null) {
    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      status: user.status,
      kycStatus: user.kycStatus,
      fullName: profile?.fullName ?? null,
      phone: profile?.phone ?? null,
      city: profile?.city ?? null,
      createdAt: user.createdAt,
    };
  }

  async getProfile(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // ⚠️ LẤY 1 BẢN GHI — KHÔNG DÙNG find()
    const profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId },
    });

    return this.toProfileResponse(user, profile);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    // ⚠️ LẤY 1 BẢN GHI — KHÔNG DÙNG find()
    let profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.profileRepo.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }

    await this.profileRepo.save(profile);
    return this.getProfile(userId);
  }

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

  // Internal API (for other services)
  async getUserByEmail(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    const profile: UserProfile | null = await this.profileRepo.findOne({
      where: { userId: user.id },
    });

    // Trả về object tổng hợp (không spread entity nếu không cần)
    return {
      ...user,
      profile, // UserProfile | null
    };
  }

  async validateUser(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return false;
    // Nếu có enum:
    return user.status === UserStatus.ACTIVE;
    // Nếu status là string thuần:
    // return user.status === 'ACTIVE';
  }
}
