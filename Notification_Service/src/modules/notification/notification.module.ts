import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController, InternalNotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { DeviceToken } from './entities/device-token.entity';
import { NotificationLog } from './entities/notification-log.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationCacheService } from './notification-cache.service';
import { CacheService } from '../../redis/cache.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      DeviceToken,
      NotificationLog,
      NotificationTemplate,
    ]),
    FirebaseModule,
  ],
  controllers: [NotificationController, InternalNotificationController],
  providers: [NotificationService, NotificationGateway, NotificationCacheService, CacheService],
  exports: [NotificationService, NotificationGateway],
})
export class NotificationModule {}
