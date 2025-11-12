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
    // Khai báo queues mặc định (main + DLQ) để service có thể sử dụng policy TTL/retry
    queues: [
      // Dead Letter Queues
      { name: 'wallet.transaction.created.dlq', options: { durable: true } },
      { name: 'wallet.transaction.completed.dlq', options: { durable: true } },
      { name: 'wallet.transaction.cancelled.dlq', options: { durable: true } },
      { name: 'wallet.payment.completed.dlq', options: { durable: true } },
    ],
    // Các binding DLQ sẽ được thiết lập bởi admin script / infra (không auto-bind ở đây để tránh vòng lặp)
    connectionInitOptions: {
      wait: true,
      timeout: 10000,
      reject: true,
    },
    enableControllerDiscovery: true,
  };
};
