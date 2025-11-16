import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from './modules/notification/notification.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationGateway } from './modules/notification/notification.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations in production
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    FirebaseModule,
    NotificationModule,
    EventsModule,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly notificationGateway: NotificationGateway) {}
  
  onModuleInit() {
    // This will trigger WebSocket Gateway instantiation
  }
}
