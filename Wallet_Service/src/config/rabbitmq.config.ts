// src/config/rabbitmq.config.ts

export const getRabbitMQConfig = () => {
  return {
    uri: `amqp://${process.env.RABBITMQ_USERNAME || 'ccm_admin'}:${process.env.RABBITMQ_PASSWORD || 'ccm_password_2024'}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}/${process.env.RABBITMQ_VHOST || 'ccm_vhost'}`,
    exchanges: [
      {
        name: process.env.RABBITMQ_EXCHANGE || 'ccm.events',
        type: 'topic',
        options: {
          durable: true,
        },
      },
    ],
    connectionInitOptions: {
      wait: true,
      timeout: 10000,
      reject: true,
    },
    enableControllerDiscovery: true,
  };
};
