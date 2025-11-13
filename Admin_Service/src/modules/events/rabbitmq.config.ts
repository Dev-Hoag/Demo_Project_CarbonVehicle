// src/modules/events/rabbitmq.config.ts
import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';

export function getRabbitMQConfig(): RabbitMQConfig {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://ccm_admin:ccm_password_2024@localhost:5672/ccm_vhost';

  return {
    uri: rabbitmqUrl,
    exchanges: [
      {
        name: 'ccm.events',
        type: 'topic',
        options: {
          durable: true,
        },
      },
      {
        name: 'admin_events',
        type: 'topic',
        options: {
          durable: true,
        },
      },
    ],
    connectionInitOptions: {
      wait: true,
      timeout: 10000,
      reject: false,
    },
    prefetchCount: 10,
    enableControllerDiscovery: true,
  };
}
