// src/modules/users/user.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { UserController } from './user.controller';
import { InternalUsersController } from './internal-user.controller'; 
import { UserService } from './user.service';

import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';
import { UserActionLog } from '../../shared/entities/user-action-log.entity'; 

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      UserActionLog, 
    ]),
  ],
  controllers: [
    UserController,
    InternalUsersController, 
  ],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}