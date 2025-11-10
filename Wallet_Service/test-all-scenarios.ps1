# ================================
# WALLET SERVICE - COMPLETE TEST
# ================================
# Tests all business scenarios

$baseUrl = "http://localhost:3008"
$internalHeaders = @{
    "Content-Type" = "application/json"
    "x-internal-api-key" = "ccm_internal_secret_key_2024"
}
$publicHeaders = @{
    "Content-Type" = "application/json"
}

$testsPassed = 0
$testsFailed = 0
$testResults = @()

function Test-API {
    param($name, $scriptBlock)
    Write-Host "`n$name" -ForegroundColor Cyan
    try {
        & $scriptBlock
        $script:testsPassed++
        $script:testResults += "[PASS] $name"
        Write-Host "  PASS" -ForegroundColor Green
        return $true
    } catch {
        $script:testsFailed++
        $script:testResults += "[FAIL] $name - $($_.Exception.Message)"
        Write-Host "  FAIL: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       WALLET SERVICE - NGHIỆP VỤ TEST SUITE              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# =================================
# SCENARIO 1: COMPLETE BUY FLOW
# =================================
Write-Host "`n=== SCENARIO 1: LUỒNG MUA CREDIT HOÀN CHỈNH ===" -ForegroundColor Yellow

$buyer = "test-buyer-$(Get-Random)"
$seller = "test-seller-$(Get-Random)"
$txnId = "txn-$(Get-Random)"

Test-API "[1.1] Nạp tiền cho buyer (1,000,000 VND)" {
    $body = @{
        userId = $buyer
        paymentId = "pay-$buyer"
        amount = 1000000
        reason = "Initial deposit"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/refund" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.balance -ne 1000000) { throw "Balance incorrect: $($response.wallet.balance)" }
    $available = [decimal]$response.wallet.balance - [decimal]$response.wallet.lockedBalance
    if ($available -ne 1000000) { throw "Available balance incorrect: $available" }
}

Test-API "[1.2] Buyer đặt mua credit - Reserve 300,000 VND" {
    $body = @{
        userId = $buyer
        transactionId = $txnId
        amount = 300000
        expirationMinutes = 30
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/reserve" -Method POST -Headers $internalHeaders -Body $body
    if ($response.reserve.status -ne "ACTIVE") { throw "Reserve status incorrect" }
    if ([decimal]$response.wallet.lockedBalance -ne 300000) { throw "Locked balance incorrect: $($response.wallet.lockedBalance)" }
    $available = [decimal]$response.wallet.balance - [decimal]$response.wallet.lockedBalance
    if ($available -ne 700000) { throw "Available balance incorrect: $available" }
}

Test-API "[1.3] Kiểm tra balance sau reserve" {
    $wallet = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/$buyer/balance" -Method GET -Headers $internalHeaders
    if ([decimal]$wallet.balance -ne 1000000) { throw "Total balance changed (shouldn't): $($wallet.balance)" }
    if ([decimal]$wallet.lockedBalance -ne 300000) { throw "Locked incorrect: $($wallet.lockedBalance)" }
    $available = [decimal]$wallet.balance - [decimal]$wallet.lockedBalance
    if ($available -ne 700000) { throw "Available incorrect: $available" }
}

Test-API "[1.4] Seller accept - Settle transaction" {
    $body = @{
        transactionId = $txnId
        buyerId = $buyer
        sellerId = $seller
        amount = 300000
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/settle" -Method POST -Headers $internalHeaders -Body $body
    
    # Buyer: 1,000,000 - 300,000 = 700,000
    if ([decimal]$response.buyerWallet.balance -ne 700000) { throw "Buyer balance incorrect after settle: $($response.buyerWallet.balance)" }
    if ([decimal]$response.buyerWallet.lockedBalance -ne 0) { throw "Buyer locked not released" }
    
    # Seller: 0 + 300,000 = 300,000 (auto-created)
    if ([decimal]$response.sellerWallet.balance -ne 300000) { throw "Seller balance incorrect: $($response.sellerWallet.balance)" }
    if ($response.reserve.status -ne "SETTLED") { throw "Reserve not settled" }
}

Test-API "[1.5] Verify final balances" {
    $buyerWallet = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/$buyer/balance" -Method GET -Headers $internalHeaders
    $sellerWallet = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/$seller/balance" -Method GET -Headers $internalHeaders
    
    if ([decimal]$buyerWallet.balance -ne 700000) { throw "Buyer final balance wrong: $($buyerWallet.balance)" }
    if ([decimal]$buyerWallet.lockedBalance -ne 0) { throw "Buyer still has locked funds" }
    if ([decimal]$sellerWallet.balance -ne 300000) { throw "Seller didn't receive funds: $($sellerWallet.balance)" }
}

# =================================
# SCENARIO 2: CANCEL TRANSACTION
# =================================
Write-Host "`n=== SCENARIO 2: HỦY GIAO DỊCH ===" -ForegroundColor Yellow

$buyer2 = "test-buyer2-$(Get-Random)"
$txnId2 = "txn-$(Get-Random)"

Test-API "[2.1] Nạp tiền cho buyer2" {
    $body = @{
        userId = $buyer2
        paymentId = "pay-$buyer2"
        amount = 500000
        reason = "Test deposit"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/refund" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.balance -ne 500000) { throw "Balance incorrect" }
}

Test-API "[2.2] Reserve 200,000 VND" {
    $body = @{
        userId = $buyer2
        transactionId = $txnId2
        amount = 200000
        expirationMinutes = 30
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/reserve" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.lockedBalance -ne 200000) { throw "Locked incorrect" }
    $available = [decimal]$response.wallet.balance - [decimal]$response.wallet.lockedBalance
    if ($available -ne 300000) { throw "Available incorrect: $available" }
}

Test-API "[2.3] Buyer cancel - Release funds" {
    $body = @{
        transactionId = $txnId2
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/release" -Method POST -Headers $internalHeaders -Body $body
    if ($response.reserve.status -ne "RELEASED") { throw "Reserve not released" }
    if ([decimal]$response.wallet.lockedBalance -ne 0) { throw "Locked not cleared" }
    $available = [decimal]$response.wallet.balance - [decimal]$response.wallet.lockedBalance
    if ($available -ne 500000) { throw "Available not restored: $available" }
}

# =================================
# SCENARIO 3: WITHDRAWAL
# =================================
Write-Host "`n=== SCENARIO 3: RÚT TIỀN ===" -ForegroundColor Yellow

Test-API "[3.1] Request withdrawal 500,000 VND" {
    $body = @{
        amount = 500000
        bankAccountName = "NGUYEN VAN TEST"
        bankAccountNumber = "9876543210"
        bankName = "Vietcombank"
        bankBranch = "HCM"
        notes = "Test withdrawal"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/wallets/withdraw" -Method POST -Headers $publicHeaders -Body $body
    
    if (-not $response.withdrawal) { throw "No withdrawal object" }
    if ($response.withdrawal.amount -ne 500000) { throw "Amount incorrect" }
    if ($response.withdrawal.fee -ne 2500) { throw "Fee incorrect (should be 0.5%)" }
    if ($response.withdrawal.netAmount -ne 497500) { throw "Net amount incorrect" }
    if ($response.withdrawal.status -ne "PENDING") { throw "Status should be PENDING" }
}

# =================================
# SCENARIO 4: MULTIPLE RESERVES
# =================================
Write-Host "`n=== SCENARIO 4: ĐẶT NHIỀU GIAO DỊCH CÙNG LÚC ===" -ForegroundColor Yellow

$user4 = "test-user4-$(Get-Random)"
$txn4a = "txn-4a-$(Get-Random)"
$txn4b = "txn-4b-$(Get-Random)"

Test-API "[4.1] Nạp 1,000,000 VND" {
    $body = @{
        userId = $user4
        paymentId = "pay-$user4"
        amount = 1000000
        reason = "Multi reserve test"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/refund" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.balance -ne 1000000) { throw "Balance incorrect" }
}

Test-API "[4.2] Reserve 300,000 cho transaction A" {
    $body = @{
        userId = $user4
        transactionId = $txn4a
        amount = 300000
        expirationMinutes = 30
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/reserve" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.lockedBalance -ne 300000) { throw "Locked incorrect" }
}

Test-API "[4.3] Reserve thêm 400,000 cho transaction B" {
    $body = @{
        userId = $user4
        transactionId = $txn4b
        amount = 400000
        expirationMinutes = 30
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/reserve" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.lockedBalance -ne 700000) { throw "Total locked incorrect (should be 700k)" }
    $available = [decimal]$response.wallet.balance - [decimal]$response.wallet.lockedBalance
    if ($available -ne 300000) { throw "Available incorrect: $available" }
}

Test-API "[4.4] Release transaction A (300k)" {
    $body = @{
        transactionId = $txn4a
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/release" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.lockedBalance -ne 400000) { throw "Should still have 400k locked (txn B)" }
    $available = [decimal]$response.wallet.balance - [decimal]$response.wallet.lockedBalance
    if ($available -ne 600000) { throw "Available should be 600k: $available" }
}

# =================================
# SCENARIO 5: ERROR CASES
# =================================
Write-Host "`n=== SCENARIO 5: KIỂM TRA ERROR HANDLING ===" -ForegroundColor Yellow

$user5 = "test-user5-$(Get-Random)"
$txn5 = "txn-5-$(Get-Random)"

Test-API "[5.1] Setup: Nạp 100,000 VND" {
    $body = @{
        userId = $user5
        paymentId = "pay-$user5"
        amount = 100000
        reason = "Error test"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/internal/wallets/refund" -Method POST -Headers $internalHeaders -Body $body
    if ([decimal]$response.wallet.balance -ne 100000) { throw "Balance incorrect" }
}

Test-API "[5.2] Reserve vượt quá balance (should fail)" {
    try {
        $body = @{
            userId = $user5
            transactionId = $txn5
            amount = 200000
            expirationMinutes = 30
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$baseUrl/internal/wallets/reserve" -Method POST -Headers $internalHeaders -Body $body
        throw "Should have failed but didn't"
    } catch {
        if ($_.Exception.Response.StatusCode -ne 400) { 
            throw "Wrong error code (expected 400 Bad Request)"
        }
        # Expected to fail - this is correct behavior
    }
}

# =================================
# RESULTS
# =================================
Write-Host @"

╔════════════════════════════════════════════════════════════╗
║                     TEST RESULTS                           ║
╠════════════════════════════════════════════════════════════╣
"@ -ForegroundColor Cyan

Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -NoNewline -ForegroundColor Green
Write-Host " " * (54 - "Passed: $testsPassed".Length) -NoNewline
Write-Host "║" -ForegroundColor Cyan

Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "Failed: $testsFailed" -NoNewline -ForegroundColor $(if ($testsFailed -eq 0) {"Green"} else {"Red"})
Write-Host " " * (54 - "Failed: $testsFailed".Length) -NoNewline
Write-Host "║" -ForegroundColor Cyan

$total = $testsPassed + $testsFailed
$percentage = [math]::Round(($testsPassed / $total) * 100, 1)
Write-Host "║  " -NoNewline -ForegroundColor Cyan
Write-Host "Coverage: $percentage%" -NoNewline -ForegroundColor $(if ($percentage -ge 90) {"Green"} elseif ($percentage -ge 70) {"Yellow"} else {"Red"})
Write-Host " " * (54 - "Coverage: $percentage%".Length) -NoNewline
Write-Host "║" -ForegroundColor Cyan

Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

if ($testsFailed -eq 0) {
    Write-Host "`n ALL TESTS PASSED! " -ForegroundColor Black -BackgroundColor Green
    Write-Host "`n Wallet Service đã sẵn sàng tích hợp!" -ForegroundColor Green
} else {
    Write-Host "`n SOME TESTS FAILED" -ForegroundColor Black -BackgroundColor Red
    Write-Host "`n Failed tests:" -ForegroundColor Yellow
    $testResults | Where-Object { $_ -like "[FAIL]*" } | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Red
    }
}

Write-Host ""
