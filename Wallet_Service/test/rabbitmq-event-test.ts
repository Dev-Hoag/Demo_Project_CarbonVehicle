// Script kiểm thử gửi sự kiện RabbitMQ cho Wallet Service
// Sử dụng amqplib để gửi event transaction.created, transaction.completed, transaction.cancelled

const amqp = require('amqplib');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://ccm_admin:ccm_password_2024@localhost:5672/ccm_vhost';
const EXCHANGE = 'ccm.events';

async function publishEvent(routingKey, payload) {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)));
  console.log(`Sent event ${routingKey}:`, payload);
  await channel.close();
  await conn.close();
}

// Ví dụ kiểm thử
async function testEvents() {
  // 1. Tạo reserve cho user-seed-1
  await publishEvent('transaction.created', {
    userId: 'user-seed-1',
    transactionId: 'txn-test-001',
    amount: 100000,
    expirationMinutes: 60,
  });

  // 2. Hoàn thành giao dịch, chuyển tiền từ user-seed-1 sang user-seed-2
  await publishEvent('transaction.completed', {
    transactionId: 'txn-test-001',
    buyerId: 'user-seed-1',
    sellerId: 'user-seed-2',
    amount: 100000,
  });

  // 3. Hủy giao dịch (nếu cần kiểm thử release)
  await publishEvent('transaction.cancelled', {
    transactionId: 'txn-test-002',
  });
}

if (require.main === module) {
  testEvents().catch(console.error);
}
