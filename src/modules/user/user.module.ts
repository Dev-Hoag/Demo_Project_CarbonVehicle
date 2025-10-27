import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { InternalUserController } from './internal-user.controller';
import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  controllers: [UserController, InternalUserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
