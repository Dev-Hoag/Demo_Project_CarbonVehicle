// Test deposit integration
const axios = require('axios');

const WALLET_SERVICE_URL = 'http://localhost:3008';
const INTERNAL_API_KEY = 'ccm-internal-secret-2024';

async function testDepositIntegration() {
  try {
    console.log('🧪 Testing Deposit Integration...\n');

    // Test 1: Initiate deposit via internal API
    console.log('📤 Step 1: Calling Wallet_Service internal deposit API...');
    const depositResponse = await axios.post(`${WALLET_SERVICE_URL}/internal/wallets/deposit`, {
      userId: 'test-user-1',
      amount: 100000,
      paymentMethod: 'VNPAY',
      returnUrl: 'http://localhost:3008/callback'
    }, {
      headers: {
        'x-internal-api-key': INTERNAL_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Deposit initiated:', JSON.stringify(depositResponse.data, null, 2));

    // Wait for processing
    console.log('\n⏳ Waiting 3 seconds for event processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Check Admin_Service logs for payment.completed processing
    console.log('\n📋 Step 2: Check Admin_Service processed the payment event');
    console.log('   Run: docker logs admin_service_app --tail 20');

    // Test 3: Check Wallet_Service logs
    console.log('\n📋 Step 3: Check Wallet_Service logs for any errors');
    console.log('   Run: docker logs ccm_wallet_service --tail 20');

    console.log('\n🎉 Integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testDepositIntegration();