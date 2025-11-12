// Test script cho Wallet Service Event-Driven Architecture
const amqp = require('amqplib');

const RABBITMQ_URL = 'amqp://ccm_admin:ccm_password_2024@localhost:5672/ccm_vhost';
const EXCHANGE = 'ccm.events';

async function publishEvent(routingKey, payload) {
  const conn = await amqp.connect(RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)));
  console.log(`✅ Sent event ${routingKey}:`, JSON.stringify(payload, null, 2));
  await channel.close();
  await conn.close();
}

async function testFullFlow() {
  const timestamp = Date.now();
  const transactionId = `txn-event-test-${timestamp}`;

  console.log('\n🧪 === WALLET SERVICE EVENT-DRIVEN TEST ===\n');
  console.log(`📝 Transaction ID: ${transactionId}\n`);

  // Test 1: Reserve funds (transaction.created)
  console.log('📤 Step 1: Sending transaction.created event...');
  await publishEvent('transaction.created', {
    userId: 'user-seed-1',
    transactionId: transactionId,
    amount: 250000,
    expirationMinutes: 60,
  });
  console.log('⏳ Waiting 2 seconds for processing...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Settle funds (transaction.completed)
  console.log('📤 Step 2: Sending transaction.completed event...');
  await publishEvent('transaction.completed', {
    transactionId: transactionId,
    buyerId: 'user-seed-1',
    sellerId: 'user-seed-2',
    amount: 250000,
  });
  console.log('⏳ Waiting 2 seconds for processing...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Test completed! Check:');
  console.log(`   1. Docker logs: docker logs ccm_wallet_service --tail 20`);
  console.log(`   2. Database: SELECT * FROM reserves WHERE transaction_id = '${transactionId}';`);
  console.log(`   3. Wallets balance: SELECT user_id, balance, locked_balance FROM wallets WHERE user_id IN ('user-seed-1', 'user-seed-2');\n`);
}

async function testCancelFlow() {
  const timestamp = Date.now();
  const transactionId = `txn-cancel-test-${timestamp}`;

  console.log('\n🧪 === TEST CANCEL FLOW ===\n');
  console.log(`📝 Transaction ID: ${transactionId}\n`);

  // Reserve funds first
  console.log('📤 Step 1: Reserve funds...');
  await publishEvent('transaction.created', {
    userId: 'user-seed-1',
    transactionId: transactionId,
    amount: 150000,
    expirationMinutes: 60,
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Then cancel
  console.log('📤 Step 2: Cancel transaction...');
  await publishEvent('transaction.cancelled', {
    transactionId: transactionId,
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Cancel test completed!\n');
}

async function testPaymentEvent() {
  const timestamp = Date.now();
  const paymentId = `pay-test-${timestamp}`;

  console.log('\n🧪 === TEST PAYMENT EVENT ===\n');

  console.log('📤 Sending payment.completed event...');
  await publishEvent('payment.completed', {
    userId: 'user-seed-1',
    amount: 500000,
    paymentId: paymentId,
    reason: 'VNPay top-up',
  });
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('✅ Payment test completed!\n');
}

// Main
(async () => {
  try {
    const testType = process.argv[2] || 'full';

    switch (testType) {
      case 'full':
        await testFullFlow();
        break;
      case 'cancel':
        await testCancelFlow();
        break;
      case 'payment':
        await testPaymentEvent();
        break;
      case 'all':
        await testFullFlow();
        await testCancelFlow();
        await testPaymentEvent();
        break;
      default:
        console.log('Usage: node test-wallet-events.js [full|cancel|payment|all]');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
