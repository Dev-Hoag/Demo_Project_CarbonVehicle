import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/entities/user.entity';
import { UserProfile } from '../../shared/entities/user-profile.entity';
import { UserStatus } from '../../shared/enums/user.enums';
import { UserEventPublisher } from './user-event.publisher';

/**
 * Consumes events from Admin Service to sync admin changes back to User Service
 */

interface AdminUserUpdateEvent {
  userId: number;
  email: string;
  fullName?: string;
  phone?: string;
  updatedBy: string;
  updatedAt: string;
}

interface AdminKycUpdateEvent {
  userId: number;
  email: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  updatedBy: string;
  updatedAt: string;
}

interface AdminUserStatusEvent {
  userId: number;
  email: string;
  action: 'LOCK' | 'UNLOCK' | 'SUSPEND' | 'ACTIVATE';
  reason?: string;
  updatedBy: string;
  updatedAt: string;
}

@Injectable()
export class AdminEventConsumer {
  private readonly logger = new Logger(AdminEventConsumer.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    private readonly userEventPublisher: UserEventPublisher,
  ) {}

  /**
   * When admin updates user profile in Admin Service,
   * sync those changes back to User Service database
   */
  @RabbitSubscribe({
    exchange: 'admin_events',
    routingKey: 'admin.user.updated',
    queue: 'user_service_admin_updates',
    queueOptions: {
      durable: true,
      messageTtl: 86400000, // 24 hours
    },
  })
  async handleAdminUserUpdated(payload: AdminUserUpdateEvent) {
    this.logger.log(`📥 Received admin.user.updated for userId=${payload.userId}`);

    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user) {
        this.logger.warn(`User ${payload.userId} not found, skipping sync`);
        return;
      }

      // Update user profile table (where fullName and phone are stored)
      const userProfile = await this.userProfileRepository.findOne({
        where: { userId: payload.userId },
      });

      if (!userProfile) {
        this.logger.warn(`UserProfile for user ${payload.userId} not found, skipping sync`);
        return;
      }

      // Only update fields that admin changed
      let updated = false;
      if (payload.fullName !== undefined && userProfile.fullName !== payload.fullName) {
        userProfile.fullName = payload.fullName;
        updated = true;
      }
      if (payload.phone !== undefined && userProfile.phone !== payload.phone) {
        userProfile.phone = payload.phone;
        updated = true;
      }

      if (updated) {
        await this.userProfileRepository.save(userProfile);
        this.logger.log(
          `✅ Successfully synced admin changes for user ${payload.email} (ID: ${payload.userId})`,
        );
      } else {
        this.logger.log(`No changes to sync for user ${payload.userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync admin update for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * When admin manually updates KYC status in Admin Service,
   * sync to User Service (though this should be rare - usually KYC flows from User → Admin)
   */
  @RabbitSubscribe({
    exchange: 'admin_events',
    routingKey: 'admin.kyc.updated',
    queue: 'user_service_admin_kyc_updates',
    queueOptions: {
      durable: true,
      messageTtl: 86400000,
    },
  })
  async handleAdminKycUpdated(payload: AdminKycUpdateEvent) {
    this.logger.log(`📥 Received admin.kyc.updated for userId=${payload.userId}`);

    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user) {
        this.logger.warn(`User ${payload.userId} not found, skipping KYC sync`);
        return;
      }

      // Map Admin Service enum to User Service enum
      let kycStatus: string;
      switch (payload.kycStatus) {
        case 'VERIFIED':
          kycStatus = 'APPROVED';
          break;
        case 'REJECTED':
          kycStatus = 'REJECTED';
          break;
        case 'PENDING':
        default:
          kycStatus = 'PENDING';
          break;
      }

      user.kycStatus = kycStatus as any;
      await this.userRepository.save(user);

      this.logger.log(
        `✅ Successfully synced admin KYC update for user ${payload.email} → ${kycStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync admin KYC update for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * When admin locks/unlocks/suspends a user in Admin Service,
   * sync the status to User Service
   */
  @RabbitSubscribe({
    exchange: 'admin_events',
    routingKey: 'admin.user.status_changed',
    queue: 'user_service_admin_status_changes',
    queueOptions: {
      durable: true,
      messageTtl: 86400000,
    },
  })
  async handleAdminUserStatusChanged(payload: AdminUserStatusEvent) {
    this.logger.log(`📥 Received admin.user.status_changed: ${payload.action} for userId=${payload.userId}`);

    try {
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });

      if (!user) {
        this.logger.warn(`User ${payload.userId} not found, skipping status sync`);
        return;
      }

      // Map Admin Service actions to User Service fields
      switch (payload.action) {
        case 'LOCK':
          user.status = UserStatus.SUSPENDED; // Lock means suspended status
          user.lockedAt = new Date();
          user.lockReason = payload.reason || 'Locked by admin';
          this.logger.log(`🔒 Locking user ${payload.email} (ID: ${payload.userId})`);
          break;
        case 'UNLOCK':
          user.status = UserStatus.ACTIVE; // Unlock means active status
          user.lockedAt = null;
          user.lockReason = null;
          this.logger.log(`🔓 Unlocking user ${payload.email} (ID: ${payload.userId})`);
          break;
        case 'SUSPEND':
          user.status = UserStatus.SUSPENDED; // Update status to SUSPENDED
          user.suspendedAt = new Date();
          user.suspendReason = payload.reason || 'Suspended by admin';
          this.logger.log(`⛔ Suspending user ${payload.email} (ID: ${payload.userId})`);
          break;
        case 'ACTIVATE':
          user.status = UserStatus.ACTIVE; // Update status to ACTIVE
          user.suspendedAt = null;
          user.suspendReason = null;
          this.logger.log(`✅ Activating user ${payload.email} (ID: ${payload.userId})`);
          break;
      }

      await this.userRepository.save(user);

      // Publish corresponding user event to Wallet Service
      try {
        switch (payload.action) {
          case 'LOCK':
            await this.userEventPublisher.publishUserLocked({
              userId: user.id,
              email: user.email,
              reason: user.lockReason,
              lockedBy: 1, // Admin user
              lockedAt: user.lockedAt.toISOString(),
            });
            break;
          case 'UNLOCK':
            await this.userEventPublisher.publishUserUnlocked({
              userId: user.id,
              email: user.email,
              unlockedBy: 1, // Admin user
              unlockedAt: new Date().toISOString(),
            });
            break;
          case 'SUSPEND':
            await this.userEventPublisher.publishUserSuspended({
              userId: user.id,
              email: user.email,
              reason: user.suspendReason,
              suspendedBy: 1, // Admin user
              suspendedAt: user.suspendedAt.toISOString(),
            });
            break;
          case 'ACTIVATE':
            await this.userEventPublisher.publishUserActivated({
              userId: user.id,
              email: user.email,
              activatedBy: 1, // Admin user
              activatedAt: new Date().toISOString(),
            });
            break;
        }
      } catch (publishError) {
        this.logger.error(
          `Failed to publish user event for action ${payload.action}: ${publishError.message}`,
        );
      }

      this.logger.log(
        `✅ Successfully synced admin status change for user ${payload.email}: ${payload.action}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync admin status change for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
