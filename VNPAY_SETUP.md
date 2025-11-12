# VNPay Integration Setup

## Current Status
✅ **TEST Gateway**: Fully functional for development/demo
⚠️ **VNPay Sandbox**: May show "invalid data" error - requires valid credentials

## VNPay Configuration

Current sandbox credentials in `docker-compose.yml`:
```yaml
VNPAY_TMN_CODE: U94AQ1QM
VNPAY_HASH_SECRET: KJTJVFNOQM3MMD742PZ4UO5GN8SU9SIK
VNPAY_URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
```

## Getting Production Credentials

### 1. Register Merchant Account
Visit: https://vnpay.vn/dang-ky-merchant

Required documents:
- Business license (Giấy phép kinh doanh)
- Tax code (Mã số thuế)
- Bank account information
- Website/app information

### 2. Get Sandbox Credentials (For Testing)
Contact VNPay support:
- Email: hotro@vnpay.vn
- Phone: 1900 55 55 77
- Request sandbox merchant account for testing

### 3. Update Configuration

After receiving credentials:

**File: `Payment_Service/docker-compose.yml`**
```yaml
VNPAY_TMN_CODE: YOUR_MERCHANT_CODE
VNPAY_HASH_SECRET: YOUR_HASH_SECRET
VNPAY_URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html  # Sandbox
# or
VNPAY_URL: https://vnpayment.vn/paymentv2/vpcpay.html  # Production
```

**Restart Payment Service:**
```bash
cd Payment_Service
docker-compose restart payment-service
```

## Testing VNPay Integration

### Test with curl:
```bash
# Login
$response = Invoke-WebRequest -Uri 'http://localhost/api/auth/login' -Method POST -Body '{"email":"user@test.com","password":"password"}' -ContentType 'application/json'
$token = ($response.Content | ConvertFrom-Json).accessToken

# Create deposit with VNPay
$body = @{amount=100000; paymentMethod='VNPAY'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost/api/wallets/deposit' -Method POST -Body $body -Headers @{Authorization="Bearer $token"; 'Content-Type'='application/json'}
```

### Expected Response:
```json
{
  "message": "Deposit initiated successfully...",
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "paymentCode": "PAY_...",
  "amount": 100000
}
```

## Common Issues

### "Invalid Data" Error
**Causes:**
1. Invalid TMN_CODE or HASH_SECRET
2. Expired sandbox credentials
3. IP address not whitelisted
4. Incorrect hash signature

**Solutions:**
1. Verify credentials with VNPay
2. Request new sandbox account
3. Add your IP to whitelist (contact VNPay)
4. Check Payment Service logs: `docker logs payment_service-payment-service-1`

### Hash Signature Issues
Check logs for signature generation:
```bash
docker logs payment_service-payment-service-1 --tail 50 | grep -i "hash\|sign"
```

## Alternative: Use TEST Gateway

For development/demo purposes, use TEST gateway:

**Frontend (Wallet.tsx):**
```typescript
paymentMethod: 'TEST'  // Instead of 'VNPAY'
```

**Benefits:**
- No external dependencies
- Instant payment simulation
- No registration required
- Perfect for demos and CI/CD

## Documentation
- VNPay API Docs: https://sandbox.vnpayment.vn/apis/docs/
- Integration Guide: https://vnpay.vn/huong-dan-tich-hop/
- Support Portal: https://vnpay.vn/lien-he/
