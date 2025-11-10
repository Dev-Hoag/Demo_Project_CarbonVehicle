# Test Admin Financial Report APIs

$JWT_TOKEN = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXNlZWQtMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInVzZXJUeXBlIjoidXNlciIsImlhdCI6MTc2Mjc2MTg0MCwiZXhwIjoxNzYyODQ4MjQwfQ.UdovQLr7eNImuhI0BDkXzvT3IsMQ4cgSjHEbiLgZZ2s"
$BASE_URL = "http://localhost:3008"
$HEADERS = @{Authorization = $JWT_TOKEN}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING ADMIN FINANCIAL REPORT APIs" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: GET /api/admin/reports/financial
Write-Host "[Test 1] GET /api/admin/reports/financial - Financial Overview" -ForegroundColor Yellow
try {
    $financial = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reports/financial" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Financial Report:" -ForegroundColor Green
    Write-Host "  Total Balance: $($financial.totalBalance) VND"
    Write-Host "  Total Locked: $($financial.totalLockedBalance) VND"
    Write-Host "  Total Wallets: $($financial.totalWallets)"
    Write-Host "  Total Transactions: $($financial.totalTransactions)"
    Write-Host "  Total Deposits: $($financial.totalDeposits) ($($financial.depositAmount) VND)"
    Write-Host "  Total Withdrawals: $($financial.totalWithdrawals) ($($financial.withdrawalAmount) VND)"
    Write-Host "  Pending Withdrawals: $($financial.pendingWithdrawals) ($($financial.pendingWithdrawalAmount) VND)`n"
} catch {
    Write-Host "[FAILED] $_`n" -ForegroundColor Red
}

# Test 2: GET /api/admin/reports/transactions
Write-Host "[Test 2] GET /api/admin/reports/transactions - Transaction Report by Day" -ForegroundColor Yellow
try {
    $transactions = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reports/transactions?groupBy=day&limit=7" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Transaction Report (Last 7 days):" -ForegroundColor Green
    foreach ($tx in $transactions) {
        Write-Host "  $($tx.date): $($tx.totalTransactions) transactions, Deposits: $($tx.deposits), Withdrawals: $($tx.withdrawals)"
    }
    Write-Host ""
} catch {
    Write-Host "[FAILED] $_`n" -ForegroundColor Red
}

# Test 3: GET /api/admin/reports/wallets
Write-Host "[Test 3] GET /api/admin/reports/wallets - Wallet Report" -ForegroundColor Yellow
try {
    $wallets = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reports/wallets" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Wallet Report:" -ForegroundColor Green
    Write-Host "  Total Wallets: $($wallets.totalWallets)"
    Write-Host "  Active Wallets: $($wallets.activeWallets)"
    Write-Host "  Total Balance: $($wallets.totalBalance) VND"
    Write-Host "  Average Balance: $($wallets.averageBalance) VND"
    Write-Host "  Top Wallets: $($wallets.topWallets.Count) users"
    if ($wallets.topWallets.Count -gt 0) {
        Write-Host "    Top 1: User $($wallets.topWallets[0].userId) - Balance: $($wallets.topWallets[0].balance) VND"
    }
    Write-Host ""
} catch {
    Write-Host "[FAILED] $_`n" -ForegroundColor Red
}

# Test 4: GET /api/admin/reports/financial with date filter
Write-Host "[Test 4] GET /api/admin/reports/financial?startDate=2025-11-01 - With Date Filter" -ForegroundColor Yellow
try {
    $financial = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reports/financial?startDate=2025-11-01" -Headers $HEADERS -Method Get
    Write-Host "[SUCCESS] Filtered Financial Report:" -ForegroundColor Green
    Write-Host "  Total Transactions since 2025-11-01: $($financial.totalTransactions)"
    Write-Host "  Total Deposits: $($financial.totalDeposits) ($($financial.depositAmount) VND)`n"
} catch {
    Write-Host "[FAILED] $_`n" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ADMIN REPORT API TESTS COMPLETED" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
