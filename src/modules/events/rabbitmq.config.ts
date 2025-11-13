// src/modules/events/rabbitmq.config.ts
import { RabbitMQConfig } from '@golevelup/nestjs-rabbitmq';

export const getRabbitMQConfig = (): RabbitMQConfig => ({
  exchanges: [
    {
      name: 'ccm.events',
      type: 'topic',
    },
    {
      name: 'admin_events',
      type: 'topic',
    },
  ],
  uri: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  connectionInitOptions: { wait: true, timeout: 20000 },
  enableControllerDiscovery: true,
  channels: {
    'payment-events-channel': {
      prefetchCount: 10,
      default: true,
    },
  },
});
