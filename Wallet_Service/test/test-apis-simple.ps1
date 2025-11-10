# Test Wallet Service APIs - Full Coverage

$JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXNlZWQtMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJUeXBlIjoidXNlciIsImlhdCI6MTc2Mjc2MTg0MCwiZXhwIjoxNzYyODQ4MjQwfQ.UdovQLr7eNImuhI0BDkXzvT3IsMQ4cgSjHEbiLgZZ2s"
$BASE_URL = "http://localhost:3008"
$HEADERS = @{Authorization = $JWT_TOKEN}

Write-Host "========================================"
Write-Host "TESTING WALLET SERVICE APIs"
Write-Host "========================================`n"

# Test 1: GET /api/wallets
Write-Host "[Test 1] GET /api/wallets - Get wallet info"
try {
    $wallet = Invoke-RestMethod -Uri "$BASE_URL/api/wallets" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Wallet ID: $($wallet.id), Balance: $($wallet.balance) VND"
    Write-Host "          Available: $($wallet.availableBalance) VND, Locked: $($wallet.lockedBalance) VND`n"
} catch {
    Write-Host "[FAILED] $_`n"
}

# Test 2: GET /api/wallets/summary
Write-Host "[Test 2] GET /api/wallets/summary - Get wallet summary"
try {
    $summary = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/summary" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Total Balance: $($summary.totalBalance) VND"
    Write-Host "          Available: $($summary.availableBalance) VND, Locked: $($summary.lockedBalance) VND`n"
} catch {
    Write-Host "[FAILED] $_`n"
}

# Test 3: GET /api/wallets/transactions
Write-Host "[Test 3] GET /api/wallets/transactions - Get transaction history"
try {
    $transactions = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/transactions" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Found $($transactions.Count) transactions"
    if ($transactions.Count -gt 0) {
        Write-Host "          Latest: $($transactions[0].type) - $($transactions[0].amount) VND`n"
    } else {
        Write-Host "          No transactions yet`n"
    }
} catch {
    Write-Host "[FAILED] $_`n"
}

# Test 4: GET /api/wallets/withdraw
Write-Host "[Test 4] GET /api/wallets/withdraw - Get withdrawal history"
try {
    $withdrawals = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/withdraw" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Found $($withdrawals.Count) withdrawals"
    if ($withdrawals.Count -gt 0) {
        Write-Host "          Latest: $($withdrawals[0].amount) VND - Status: $($withdrawals[0].status)`n"
    } else {
        Write-Host "          No withdrawals yet`n"
    }
} catch {
    Write-Host "[FAILED] $_`n"
}

# Test 5: GET /api/wallets/limits
Write-Host "[Test 5] GET /api/wallets/limits - Get wallet limits"
try {
    $limits = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/limits" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Daily Limit: $($limits.dailyLimit) VND"
    Write-Host "          Monthly Limit: $($limits.monthlyLimit) VND`n"
} catch {
    Write-Host "[FAILED] $_`n"
}

# Test 6: POST /api/wallets/deposit
Write-Host "[Test 6] POST /api/wallets/deposit - Deposit funds"
try {
    $timestamp = Get-Date -Format "yyyyMMddHHmmss"
    $depositBody = @{
        amount = 50000
        paymentMethod = "bank_transfer"
        paymentReference = "TEST-DEPOSIT-$timestamp"
    } | ConvertTo-Json
    $deposit = Invoke-RestMethod -Uri "$BASE_URL/api/wallets/deposit" -Headers $HEADERS -Method Post -Body $depositBody -ContentType "application/json"
    Write-Host "[SUCCESS] Deposited: $($deposit.amount) VND"
    Write-Host "          New Balance: $($deposit.newBalance) VND`n"
} catch {
    Write-Host "[FAILED] $_`n"
}

# Test 7: GET /health
Write-Host "[Test 7] GET /health - Health check"
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Host "[SUCCESS] Service Status: $($health.status)"
    Write-Host "          Message: $($health.message)`n"
} catch {
    Write-Host "[FAILED] $_`n"
}

Write-Host "========================================"
Write-Host "WALLET SERVICE API TESTS COMPLETED"
Write-Host "========================================`n"
