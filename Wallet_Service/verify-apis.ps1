# Quick API Verification Test
# Tests all critical APIs after fixes

$baseUrl = "http://localhost:3008"
$headers = @{
    "Content-Type" = "application/json"
    "x-internal-api-key" = "ccm_internal_secret_key_2024"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   WALLET SERVICE - API VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0

# Test 1: Refund (Add Balance)
Write-Host "[1/5] Testing Refund API..." -ForegroundColor Yellow
try {
    $body = @{ userId="verify-test-1"; paymentId="pay-verify-1"; amount=1000000; reason="Test" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/refund" -Method POST -Headers $headers -Body $body
    if ($response.wallet.balance -eq 1000000) {
        Write-Host "   PASS: Balance = 1,000,000 VND" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   FAIL: Incorrect balance" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Reserve Funds  
Write-Host "[2/5] Testing Reserve API..." -ForegroundColor Yellow
try {
    $body = @{ userId="verify-test-1"; transactionId="txn-verify-1"; amount=300000; expirationMinutes=30 } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/reserve" -Method POST -Headers $headers -Body $body
    if ($response.wallet.lockedBalance -eq 300000) {
        Write-Host "   PASS: Locked = 300,000 VND" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   FAIL: Incorrect locked balance" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 3: Settle Transaction (THE FIX)
Write-Host "[3/5] Testing Settle API (Fixed)..." -ForegroundColor Yellow
try {
    $body = @{ transactionId="txn-verify-1"; buyerId="verify-test-1"; sellerId="verify-seller"; amount=300000 } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/settle" -Method POST -Headers $headers -Body $body
    if ($response.buyerWallet.balance -eq 700000 -and $response.sellerWallet.balance -eq 300000) {
        Write-Host "   PASS: Buyer=700k, Seller=300k" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   FAIL: Incorrect balances" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 4: Withdrawal Request
Write-Host "[4/5] Testing Withdrawal API..." -ForegroundColor Yellow
try {
    $body = @{
        amount=100000
        bankAccountName="Test User"
        bankAccountNumber="1234567890"
        bankName="Test Bank"
    } | ConvertTo-Json
    $headers2 = @{"Content-Type"="application/json"}
    $response = Invoke-RestMethod -Uri "$baseUrl/api/wallets/withdraw" -Method POST -Headers $headers2 -Body $body
    if ($response.withdrawal -and $response.withdrawal.amount -eq 100000) {
        Write-Host "   PASS: Withdrawal created" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   FAIL: No withdrawal object" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 5: Get Balance
Write-Host "[5/5] Testing Balance Query..." -ForegroundColor Yellow
try {
    $wallet = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/verify-test-1/balance" -Method GET -Headers $headers
    if ($wallet.balance -eq 700000 -and $wallet.lockedBalance -eq 0) {
        Write-Host "   PASS: Balance=700k, Locked=0" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "   FAIL: Incorrect values" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "   FAIL: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   TEST RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Passed: $passed/5" -ForegroundColor $(if ($passed -eq 5) {"Green"} else {"Yellow"})
Write-Host " Failed: $failed/5" -ForegroundColor $(if ($failed -eq 0) {"Green"} else {"Red"})

if ($passed -eq 5) {
    Write-Host "`n ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host " Wallet Service APIs are working correctly." -ForegroundColor Green
} else {
    Write-Host "`n SOME TESTS FAILED" -ForegroundColor Red
    Write-Host " Please check service logs." -ForegroundColor Yellow
}
Write-Host "========================================`n" -ForegroundColor Cyan
