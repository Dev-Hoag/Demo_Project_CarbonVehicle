import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

/**
 * Publisher for admin-initiated events to sync back to User Service
 */

export interface AdminUserUpdatePayload {
  userId: number; // external_user_id in User Service
  email: string;
  fullName?: string;
  phone?: string;
  updatedBy: string; // admin username
  updatedAt: string;
}

export interface AdminKycUpdatePayload {
  userId: number;
  email: string;
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  updatedBy: string;
  updatedAt: string;
}

export interface AdminUserStatusPayload {
  userId: number;
  email: string;
  action: 'LOCK' | 'UNLOCK' | 'SUSPEND' | 'ACTIVATE';
  reason?: string;
  updatedBy: string;
  updatedAt: string;
}

@Injectable()
export class AdminEventPublisher {
  private readonly logger = new Logger(AdminEventPublisher.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Publish when admin updates user profile info
   * User Service should consume this to sync changes back
   */
  async publishAdminUserUpdated(payload: AdminUserUpdatePayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'admin_events', // exchange
        'admin.user.updated', // routing key
        payload,
      );
      this.logger.log(`✅ Published admin.user.updated for userId=${payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish admin.user.updated: ${error.message}`, error.stack);
    }
  }

  /**
   * Publish when admin manually updates KYC status
   */
  async publishAdminKycUpdated(payload: AdminKycUpdatePayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'admin_events',
        'admin.kyc.updated',
        payload,
      );
      this.logger.log(`✅ Published admin.kyc.updated for userId=${payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish admin.kyc.updated: ${error.message}`, error.stack);
    }
  }

  /**
   * Publish when admin locks/unlocks/suspends a user
   */
  async publishAdminUserStatusChanged(payload: AdminUserStatusPayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'admin_events',
        'admin.user.status_changed',
        payload,
      );
      this.logger.log(`✅ Published admin.user.status_changed: ${payload.action} for userId=${payload.userId}`);
    } catch (error) {
      this.logger.error(`Failed to publish admin.user.status_changed: ${error.message}`, error.stack);
    }
  }
}
