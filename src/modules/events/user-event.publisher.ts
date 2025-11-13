import { Injectable, Logger } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

interface UserCreatedPayload {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  userType: 'EV_OWNER' | 'BUYER' | 'CVA';
  createdAt: string;
}

interface UserUpdatedPayload {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  userType?: 'EV_OWNER' | 'BUYER' | 'CVA';
}

interface UserKycStatusPayload {
  userId: number;
  email: string;
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  updatedAt: string;
}

@Injectable()
export class UserEventPublisher {
  private readonly logger = new Logger(UserEventPublisher.name);

  constructor(private readonly amqpConnection: AmqpConnection) {}

  /**
   * Publish user.created event when a new user registers
   */
  async publishUserCreated(payload: UserCreatedPayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'user_events',
        'user.created',
        payload,
      );
      this.logger.log(`Published user.created event for: ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish user.created event for ${payload.email}: ${error.message}`,
        error.stack,
      );
      // Don't throw - publishing failure shouldn't block user registration
    }
  }

  /**
   * Publish user.updated event when user profile is updated
   */
  async publishUserUpdated(payload: UserUpdatedPayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'user_events',
        'user.updated',
        payload,
      );
      this.logger.log(`Published user.updated event for: ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish user.updated event for ${payload.email}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Publish user.kyc.status_updated event when KYC status changes
   */
  async publishKycStatusUpdated(payload: UserKycStatusPayload): Promise<void> {
    try {
      await this.amqpConnection.publish(
        'user_events',
        'user.kyc.status_updated',
        payload,
      );
      this.logger.log(
        `Published user.kyc.status_updated event for user ${payload.userId}: ${payload.kycStatus}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish KYC status event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
