// Test script for Admin_Service payment event consumption
const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://ccm_admin:ccm_password_2024@localhost:5672/ccm_vhost';
const EXCHANGE = 'ccm.events';

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function publishPaymentCompleted() {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  const event = {
    id: generateId(),
    type: 'payment.completed',
    version: 1,
    source: 'payment-service',
    aggregateId: 'test-payment-001',
    timestamp: new Date().toISOString(),
    payload: {
      paymentCode: 'test-payment-001',
      transactionId: 'txn-test-001',
      userId: 1,
      gateway: 'VNPAY',
      amount: 100000,
      currency: 'VND',
      orderInfo: 'Test payment',
      gatewayTransactionId: 'gw-txn-001',
      gatewayResponseCode: '00',
      completedAt: new Date().toISOString(),
    },
    metadata: {
      correlationId: generateId(),
      actor: 'system',
      retries: 0,
    },
  };

  channel.publish(EXCHANGE, 'payment.completed', Buffer.from(JSON.stringify(event)));
  console.log(`✅ Sent payment.completed event:`, JSON.stringify(event, null, 2));

  await channel.close();
  await conn.close();
}

publishPaymentCompleted().catch(console.error);