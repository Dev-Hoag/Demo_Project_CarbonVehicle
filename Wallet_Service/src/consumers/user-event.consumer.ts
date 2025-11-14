import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from '../shared/entities/wallet.entity';

enum WalletStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

interface UserLockedEvent {
  userId: number;
  email: string;
  reason: string;
  lockedBy: number;
  lockedAt: string;
}

interface UserUnlockedEvent {
  userId: number;
  email: string;
  unlockedBy: number;
  unlockedAt: string;
}

interface UserSuspendedEvent {
  userId: number;
  email: string;
  reason: string;
  suspendedBy: number;
  suspendedAt: string;
}

interface UserActivatedEvent {
  userId: number;
  email: string;
  activatedBy: number;
  activatedAt: string;
}

interface UserDeletedEvent {
  userId: number;
  email: string;
  reason: string;
  deletedBy: number;
  deletedAt: string;
}

@Injectable()
export class UserEventConsumer {
  private readonly logger = new Logger(UserEventConsumer.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepo: Repository<Wallet>,
  ) {}

  /**
   * Handle user.locked event from User Service
   * When admin locks a user, we should suspend their wallet to prevent transactions
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.locked',
    queue: 'wallet_service_user_locked',
    queueOptions: {
      durable: true,
      arguments: {
        'x-message-ttl': 86400000, // 24 hours
      },
    },
  })
  async handleUserLocked(payload: UserLockedEvent) {
    try {
      this.logger.log(`🔒 Received user.locked event for user ${payload.userId}: ${payload.email}`);

      // Find wallet by userId
      const wallet = await this.walletRepo.findOne({
        where: { userId: payload.userId.toString() },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for user ${payload.userId}. Skipping wallet suspension.`);
        return;
      }

      // Suspend wallet
      wallet.status = WalletStatus.SUSPENDED;
      wallet.notes = `Wallet suspended due to user account lock. Reason: ${payload.reason}`;
      await this.walletRepo.save(wallet);

      this.logger.log(
        `✅ Successfully suspended wallet ${wallet.id} for locked user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle user.locked event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle user.unlocked event from User Service
   * When admin unlocks a user, we should reactivate their wallet
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.unlocked',
    queue: 'wallet_service_user_unlocked',
    queueOptions: {
      durable: true,
    },
  })
  async handleUserUnlocked(payload: UserUnlockedEvent) {
    try {
      this.logger.log(`🔓 Received user.unlocked event for user ${payload.userId}`);

      const wallet = await this.walletRepo.findOne({
        where: { userId: payload.userId.toString() },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for user ${payload.userId}. Skipping wallet activation.`);
        return;
      }

      // Only reactivate if wallet was suspended due to lock
      if (wallet.status === WalletStatus.SUSPENDED) {
        wallet.status = WalletStatus.ACTIVE;
        wallet.notes = 'Wallet reactivated after user account unlock';
        await this.walletRepo.save(wallet);

        this.logger.log(
          `✅ Successfully reactivated wallet ${wallet.id} for unlocked user ${payload.userId}`,
        );
      } else {
        this.logger.log(
          `Wallet ${wallet.id} status is ${wallet.status}, no action needed for unlock`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle user.unlocked event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle user.suspended event from User Service
   * When admin suspends a user, we should suspend their wallet
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.suspended',
    queue: 'wallet_service_user_suspended',
    queueOptions: {
      durable: true,
    },
  })
  async handleUserSuspended(payload: UserSuspendedEvent) {
    try {
      this.logger.log(`⏸️  Received user.suspended event for user ${payload.userId}: ${payload.email}`);

      const wallet = await this.walletRepo.findOne({
        where: { userId: payload.userId.toString() },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for user ${payload.userId}. Skipping wallet suspension.`);
        return;
      }

      // Suspend wallet
      wallet.status = WalletStatus.SUSPENDED;
      wallet.notes = `Wallet suspended due to user account suspension. Reason: ${payload.reason}`;
      await this.walletRepo.save(wallet);

      this.logger.log(
        `✅ Successfully suspended wallet ${wallet.id} for suspended user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle user.suspended event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle user.activated event from User Service
   * When admin activates a suspended user, we should reactivate their wallet
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.activated',
    queue: 'wallet_service_user_activated',
    queueOptions: {
      durable: true,
    },
  })
  async handleUserActivated(payload: UserActivatedEvent) {
    try {
      this.logger.log(`▶️  Received user.activated event for user ${payload.userId}`);

      const wallet = await this.walletRepo.findOne({
        where: { userId: payload.userId.toString() },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for user ${payload.userId}. Skipping wallet activation.`);
        return;
      }

      // Only reactivate if wallet was suspended
      if (wallet.status === WalletStatus.SUSPENDED) {
        wallet.status = WalletStatus.ACTIVE;
        wallet.notes = 'Wallet reactivated after user account activation';
        await this.walletRepo.save(wallet);

        this.logger.log(
          `✅ Successfully reactivated wallet ${wallet.id} for activated user ${payload.userId}`,
        );
      } else {
        this.logger.log(
          `Wallet ${wallet.id} status is ${wallet.status}, no action needed for activation`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle user.activated event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle user.deleted event from User Service
   * When admin deletes a user, we should close their wallet
   */
  @RabbitSubscribe({
    exchange: 'user_events',
    routingKey: 'user.deleted',
    queue: 'wallet_service_user_deleted',
    queueOptions: {
      durable: true,
    },
  })
  async handleUserDeleted(payload: UserDeletedEvent) {
    try {
      this.logger.log(`🗑️  Received user.deleted event for user ${payload.userId}: ${payload.email}`);

      const wallet = await this.walletRepo.findOne({
        where: { userId: payload.userId.toString() },
      });

      if (!wallet) {
        this.logger.warn(`Wallet not found for user ${payload.userId}. Skipping wallet closure.`);
        return;
      }

      // Close wallet (soft delete - we keep the data)
      wallet.status = WalletStatus.CLOSED;
      wallet.notes = `Wallet closed due to user account deletion. Reason: ${payload.reason}`;
      await this.walletRepo.save(wallet);

      this.logger.log(
        `✅ Successfully closed wallet ${wallet.id} for deleted user ${payload.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to handle user.deleted event for user ${payload.userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
