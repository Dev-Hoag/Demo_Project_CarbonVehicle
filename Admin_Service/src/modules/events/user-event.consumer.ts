import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagedUser } from '../../shared/entities/managed-user.entity';
import { ManagedUserStatus, UserType, KycStatus } from '../../shared/enums/admin.enums';

interface UserCreatedEvent {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  userType: 'EV_OWNER' | 'BUYER' | 'CVA';
  createdAt: string;
}

interface UserUpdatedEvent {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  userType?: 'EV_OWNER' | 'BUYER' | 'CVA';
}

interface UserKycStatusEvent {
  userId: number;
  email: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  updatedAt: string;
}

@Injectable()
export class UserEventConsumer {
  private readonly logger = new Logger(UserEventConsumer.name);

  constructor(
    @InjectRepository(ManagedUser)
    private readonly managedUserRepo: Repository<ManagedUser>,
  ) {}

  /**
   * Handle user.created event from User Service
   * Automatically creates a managed user record when a new user registers
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.created',
    queue: 'admin_service_user_created',
    queueOptions: {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours
      },
    },
  })
  async handleUserCreated(payload: UserCreatedEvent) {
    try {
      this.logger.log(`Received user.created event for: ${payload.email}`);

      // Check if user already exists in managed_user table
      const existingUser = await this.managedUserRepo.findOne({
        where: { email: payload.email },
      });

      if (existingUser) {
        this.logger.warn(`User ${payload.email} already exists in managed_user. Skipping.`);
        return;
      }

      // Map UserType from User Service to Admin Service enum
      let userType: UserType;
      switch (payload.userType) {
        case 'EV_OWNER':
          userType = UserType.EV_OWNER;
          break;
        case 'BUYER':
          userType = UserType.BUYER;
          break;
        case 'CVA':
          userType = UserType.CVA;
          break;
        default:
          userType = UserType.EV_OWNER; // Default fallback
      }

      // Create new managed user
      const managedUser = new ManagedUser();
      managedUser.externalUserId = payload.id.toString();
      managedUser.email = payload.email;
      if (payload.fullName) managedUser.fullName = payload.fullName;
      if (payload.phone) managedUser.phone = payload.phone;
      managedUser.userType = userType;
      managedUser.status = ManagedUserStatus.ACTIVE;
      managedUser.kycStatus = KycStatus.PENDING;

      await this.managedUserRepo.save(managedUser);

      this.logger.log(
        `✅ Successfully synced user ${payload.email} to managed_user (ID: ${managedUser.id})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle user.created event for ${payload.email}: ${error.message}`,
        error.stack,
      );
      // Don't throw - we don't want to NACK and retry indefinitely for sync issues
    }
  }

  /**
   * Handle user.updated event from User Service
   * Updates managed user record when user profile is updated
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.updated',
    queue: 'admin_service_user_updated',
    queueOptions: {
      durable: true,
    },
  })
  async handleUserUpdated(payload: UserUpdatedEvent) {
    try {
      this.logger.log(`Received user.updated event for: ${payload.email}`);

      // Find user by email
      const managedUser = await this.managedUserRepo.findOne({
        where: { email: payload.email },
      });

      if (!managedUser) {
        this.logger.warn(
          `User ${payload.email} not found in managed_user. Cannot update.`,
        );
        return;
      }

      // Update fields if provided
      if (payload.fullName !== undefined) {
        managedUser.fullName = payload.fullName;
      }
      if (payload.phone !== undefined) {
        managedUser.phone = payload.phone;
      }
      if (payload.userType) {
        switch (payload.userType) {
          case 'EV_OWNER':
            managedUser.userType = UserType.EV_OWNER;
            break;
          case 'BUYER':
            managedUser.userType = UserType.BUYER;
            break;
          case 'CVA':
            managedUser.userType = UserType.CVA;
            break;
        }
      }

      await this.managedUserRepo.save(managedUser);

      this.logger.log(`✅ Successfully updated managed_user for ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle user.updated event for ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle user.kyc.status_updated event from User Service
   * Updates managed user KYC status when admin approves/rejects KYC
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.kyc.status_updated',
    queue: 'admin_service_kyc_status_updated',
    queueOptions: {
      durable: true,
    },
  })
  async handleKycStatusUpdated(payload: UserKycStatusEvent) {
    try {
      this.logger.log(
        `Received user.kyc.status_updated event for user ${payload.userId}: ${payload.kycStatus}`,
      );

      // Find user by email
      const managedUser = await this.managedUserRepo.findOne({
        where: { email: payload.email },
      });

      if (!managedUser) {
        this.logger.warn(
          `User ${payload.email} not found in managed_user. Cannot update KYC status.`,
        );
        return;
      }

      // Map KYC status (User Service uses APPROVED, Admin Service uses VERIFIED)
      let kycStatus: KycStatus;
      switch (payload.kycStatus) {
        case 'APPROVED':
          kycStatus = KycStatus.VERIFIED;
          break;
        case 'REJECTED':
          kycStatus = KycStatus.REJECTED;
          break;
        case 'PENDING':
        default:
          kycStatus = KycStatus.PENDING;
          break;
      }

      managedUser.kycStatus = kycStatus;
      await this.managedUserRepo.save(managedUser);

      this.logger.log(
        `✅ Successfully updated KYC status for ${payload.email} to ${payload.kycStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle KYC status event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
