import { Module, Global } from '@nestjs/common';
import { RabbitMQModule as NestRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OutboxPublisherService } from './outbox-publisher.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from '../../shared/entities/outbox-event.entity';

@Global()
@Module({
  imports: [
    NestRabbitMQModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        exchanges: [
          {
            name: 'ccm.events',
            type: 'topic',
            options: {
              durable: true,
            },
          },
          {
            name: 'ccm.events.dlx',
            type: 'topic',
            options: {
              durable: true,
            },
          },
        ],
        uri: configService.get<string>(
          'RABBITMQ_URL',
          'amqp://ccm_admin:ccm_password_2024@localhost:5672/ccm_vhost',
        ),
        connectionInitOptions: { wait: true, timeout: 30000 },
        enableControllerDiscovery: true,
        connectionManagerOptions: {
          heartbeatIntervalInSeconds: 15,
          reconnectTimeInSeconds: 30,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OutboxEvent]),
  ],
  providers: [OutboxPublisherService],
  exports: [NestRabbitMQModule, OutboxPublisherService],
})
export class RabbitMQModule {}
