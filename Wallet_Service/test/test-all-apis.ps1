# Test Wallet Service APIs - Full Coverage
# Run this after Wallet Service is started

$JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXNlZWQtMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJUeXBlIjoidXNlciIsImlhdCI6MTc2Mjc2MTg0MCwiZXhwIjoxNzYyODQ4MjQwfQ.UdovQLr7eNImuhI0BDkXzvT3IsMQ4cgSjHEbiLgZZ2s"
$BASE_URL = "http://localhost:3008"
$HEADERS = @{Authorization = $JWT_TOKEN}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🧪 TESTING WALLET SERVICE APIs" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: GET /api/wallets - Get wallet info
Write-Host "📋 Test 1: GET /api/wallets - Get wallet info" -ForegroundColor Yellow
try {
    $wallet = Invoke-RestMethod -Uri "$BASE_URL/api/wallets" -Headers $HEADERS -Method Get
    Write-Host "✅ SUCCESS - Wallet ID: $($wallet.id), Balance: $($wallet.balance) VND" -ForegroundColor Green
    Write-Host "   Available: $($wallet.availableBalance) VND, Locked: $($wallet.lockedBalance) VND`n"
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

# Test 2: GET /api/wallets/summary - Get wallet summary
Write-Host "📊 Test 2: GET /api/wallets/summary - Get wallet summary" -ForegroundColor Yellow
try {
    $summary = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/summary" -Headers $HEADERS -Method Get
    Write-Host "✅ SUCCESS - Total Balance: $($summary.totalBalance) VND" -ForegroundColor Green
    Write-Host "   Available: $($summary.availableBalance) VND, Locked: $($summary.lockedBalance) VND`n"
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

# Test 3: GET /api/wallets/transactions - Get transaction history
Write-Host "📜 Test 3: GET /api/wallets/transactions - Get transaction history" -ForegroundColor Yellow
try {
    $transactions = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/transactions" -Headers $HEADERS -Method Get
    Write-Host "✅ SUCCESS - Found $($transactions.Count) transactions" -ForegroundColor Green
    if ($transactions.Count -gt 0) {
        Write-Host "   Latest: $($transactions[0].type) - $($transactions[0].amount) VND`n"
    } else {
        Write-Host "   No transactions yet`n"
    }
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

# Test 4: GET /api/wallets/withdraw - Get withdrawal history
Write-Host "💸 Test 4: GET /api/wallets/withdraw - Get withdrawal history" -ForegroundColor Yellow
try {
    $withdrawals = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/withdraw" -Headers $HEADERS -Method Get
    Write-Host "✅ SUCCESS - Found $($withdrawals.Count) withdrawals" -ForegroundColor Green
    if ($withdrawals.Count -gt 0) {
        Write-Host "   Latest: $($withdrawals[0].amount) VND - Status: $($withdrawals[0].status)`n"
    } else {
        Write-Host "   No withdrawals yet`n"
    }
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

# Test 5: GET /api/wallets/limits - Get wallet limits
Write-Host "🔒 Test 5: GET /api/wallets/limits - Get wallet limits" -ForegroundColor Yellow
try {
    $limits = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/limits" -Headers $HEADERS -Method Get
    Write-Host "✅ SUCCESS - Daily Limit: $($limits.dailyLimit) VND" -ForegroundColor Green
    Write-Host "   Monthly Limit: $($limits.monthlyLimit) VND`n"
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

# Test 6: POST /api/wallets/deposit - Deposit funds
Write-Host "💰 Test 6: POST /api/wallets/deposit - Deposit funds" -ForegroundColor Yellow
try {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $depositBody = @{
        amount = 50000
        paymentMethod = "bank_transfer"
        paymentReference = "TEST-DEPOSIT-$timestamp"
    } | ConvertTo-Json
    $deposit = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/deposit" -Headers $HEADERS -Method Post -Body $depositBody -ContentType "application/json"
    Write-Host "✅ SUCCESS - Deposited: $($deposit.amount) VND" -ForegroundColor Green
    Write-Host "   New Balance: $($deposit.newBalance) VND`n"
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

# Test 7: GET /health - Health check
Write-Host "🏥 Test 7: GET /health - Health check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Host "✅ SUCCESS - Service Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Message: $($health.message)`n"
} catch {
    Write-Host "❌ FAILED: $_`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✨ WALLET SERVICE API TESTS COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
