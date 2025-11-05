// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { InternalAuthController } from './internal-auth.controller'; // 👈 Import controller mới

// 👇 entities mà AuthService inject bằng @InjectRepository(...)
import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserProfile]),   // 👈 BẮT BUỘC CÓ
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: 60 * 60 * 24 },     // 1 day
      }),
    }),
  ],
  controllers: [
    AuthController,           // Public endpoints: /api/auth/login, /api/auth/register
    InternalAuthController    // 👈 Internal endpoints: /internal/auth/verify (chỉ cho Gateway gọi)
  ],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService, EmailService],
})
export class AuthModule {}
