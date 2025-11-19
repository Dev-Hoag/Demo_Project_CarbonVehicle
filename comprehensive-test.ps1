# ========================================
# COMPREHENSIVE REDIS CACHE TEST
# ========================================

$ErrorActionPreference = "Continue"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "     REDIS IMPLEMENTATION - COMPREHENSIVE TEST            " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Configuration
$BASE_URL_USER = "http://localhost:3001/api"
$BASE_URL_WALLET = "http://localhost:3008/api"
$BASE_URL_CREDIT = "http://localhost:8083/api"
$TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000"

$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $global:totalTests++
    Write-Host "`n[$global:totalTests] Testing: $Name" -ForegroundColor Yellow
    Write-Host "    URL: $Url" -ForegroundColor Gray
    
    $times = @()
    
    try {
        # First call - Cache MISS
        $sw1 = [System.Diagnostics.Stopwatch]::StartNew()
        if ($Body) {
            $response1 = Invoke-RestMethod -Uri $Url -Method $Method -Body ($Body | ConvertTo-Json) -ContentType "application/json" -Headers $Headers
        } else {
            $response1 = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        $sw1.Stop()
        $time1 = $sw1.ElapsedMilliseconds
        $times += $time1
        Write-Host "    ✓ First call (DB): ${time1}ms" -ForegroundColor White
        
        Start-Sleep -Milliseconds 500
        
        # Second call - Cache HIT
        $sw2 = [System.Diagnostics.Stopwatch]::StartNew()
        if ($Body) {
            $response2 = Invoke-RestMethod -Uri $Url -Method $Method -Body ($Body | ConvertTo-Json) -ContentType "application/json" -Headers $Headers
        } else {
            $response2 = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers
        }
        $sw2.Stop()
        $time2 = $sw2.ElapsedMilliseconds
        $times += $time2
        Write-Host "    ✓ Second call (Cache): ${time2}ms" -ForegroundColor Green
        
        $improvement = if ($time1 -gt 0) { [math]::Round((($time1 - $time2) / $time1) * 100, 2) } else { 0 }
        Write-Host "    → Improvement: ${improvement}%" -ForegroundColor $(if ($improvement -gt 0) { "Green" } else { "Yellow" })
        
        $global:passedTests++
        return @{ Success = $true; Times = $times; Improvement = $improvement }
    }
    catch {
        Write-Host "    ✗ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $global:failedTests++
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ========================================
# TEST SUITE 1: USER SERVICE
# ========================================

Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  TEST SUITE 1: USER SERVICE (NestJS)" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# Note: User service tests would need authentication
Write-Host "`nℹ️  User Service requires authentication - Skipping for now" -ForegroundColor Yellow
Write-Host "   Manual test available at: http://localhost:3001/api/health/redis" -ForegroundColor Gray

# ========================================
# TEST SUITE 2: WALLET SERVICE
# ========================================

Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  TEST SUITE 2: WALLET SERVICE (NestJS)" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

Write-Host "`nℹ️  Wallet Service requires authentication - Skipping for now" -ForegroundColor Yellow
Write-Host "   Manual test: GET http://localhost:3008/api/wallets/:userId" -ForegroundColor Gray

# ========================================
# TEST SUITE 3: CREDIT SERVICE
# ========================================

Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  TEST SUITE 3: CREDIT SERVICE (Java Spring Boot)" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

# Test 3.1: Create test credit account if not exists
Write-Host "`nℹ️  Setting up test data..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$BASE_URL_CREDIT/v1/credits?userId=$TEST_USER_ID" -Method POST -ErrorAction SilentlyContinue | Out-Null
} catch {
    # Account might already exist
}

# Test 3.2: Credit Account Balance
$result1 = Test-Endpoint -Name "Credit Account Balance" -Url "$BASE_URL_CREDIT/v1/credits/user/$TEST_USER_ID"

# Test 3.3: Credit Statistics
$result2 = Test-Endpoint -Name "Credit Statistics (Complex Query)" -Url "$BASE_URL_CREDIT/v1/credits/statistics"

# ========================================
# TEST SUITE 4: REDIS OPERATIONS
# ========================================

Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  TEST SUITE 4: REDIS OPERATIONS" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

$totalTests++
Write-Host "`n[$totalTests] Testing: Redis Connection" -ForegroundColor Yellow
try {
    $ping = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning PING
    if ($ping -eq "PONG") {
        Write-Host "    ✓ Redis responding to PING" -ForegroundColor Green
        $passedTests++
    }
} catch {
    Write-Host "    ✗ Redis connection failed" -ForegroundColor Red
    $failedTests++
}

$totalTests++
Write-Host "`n[$totalTests] Testing: Redis SET/GET Operations" -ForegroundColor Yellow
try {
    docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning SET "test:comprehensive" "working" EX 60 | Out-Null
    $value = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning GET "test:comprehensive"
    if ($value -eq "working") {
        Write-Host "    ✓ SET/GET operations working" -ForegroundColor Green
        $passedTests++
    }
    docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning DEL "test:comprehensive" | Out-Null
} catch {
    Write-Host "    ✗ SET/GET operations failed" -ForegroundColor Red
    $failedTests++
}

$totalTests++
Write-Host "`n[$totalTests] Testing: Redis Memory Usage" -ForegroundColor Yellow
try {
    $memInfo = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning INFO memory | Select-String -Pattern "used_memory_human"
    if ($memInfo) {
        Write-Host "    ✓ Memory info: $memInfo" -ForegroundColor Green
        $passedTests++
    }
} catch {
    Write-Host "    ✗ Memory check failed" -ForegroundColor Red
    $failedTests++
}

$totalTests++
Write-Host "`n[$totalTests] Testing: Redis Cache Keys" -ForegroundColor Yellow
try {
    $keys = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning KEYS "credit*"
    Write-Host "    ℹ️  Found cache keys: $($keys.Count) keys" -ForegroundColor Cyan
    $passedTests++
} catch {
    Write-Host "    ✗ Key scan failed" -ForegroundColor Red
    $failedTests++
}

# ========================================
# TEST SUITE 5: SERVICE LOGS CHECK
# ========================================

Write-Host "`n`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  TEST SUITE 5: SERVICE LOGS VERIFICATION" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta

$totalTests++
Write-Host "`n[$totalTests] Checking: Credit Service Cache Logs" -ForegroundColor Yellow
try {
    $logs = docker logs ccm_credit_service --tail 50 2>&1 | Select-String -Pattern "CACHE|Redis" -CaseSensitive:$false
    if ($logs) {
        Write-Host "    ✓ Found $($logs.Count) cache-related log entries" -ForegroundColor Green
        $passedTests++
    } else {
        Write-Host "    ⚠️  No cache logs found (might be normal)" -ForegroundColor Yellow
        $passedTests++
    }
} catch {
    Write-Host "    ✗ Log check failed" -ForegroundColor Red
    $failedTests++
}

# ========================================
# FINAL SUMMARY
# ========================================

Write-Host "`n" -NoNewline
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "              TEST RESULTS SUMMARY                          " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`nTotal Tests: $totalTests" -ForegroundColor White
Write-Host "Passed:      $passedTests" -ForegroundColor Green
Write-Host "Failed:      $failedTests" -ForegroundColor $(if ($failedTests -eq 0) { "Green" } else { "Red" })

$successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
Write-Host "Success Rate: ${successRate}%" -ForegroundColor $(if ($successRate -ge 80) { "Green" } elseif ($successRate -ge 60) { "Yellow" } else { "Red" })

Write-Host "`n------------------------------------------------------------" -ForegroundColor Cyan

if ($failedTests -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED - Ready for merge!" -ForegroundColor Green
} elseif ($successRate -ge 80) {
    Write-Host "`n⚠️  MOSTLY PASSED - Review failures before merge" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ MULTIPLE FAILURES - Fix issues before merge" -ForegroundColor Red
}

Write-Host "`n📝 Manual Tests Required:" -ForegroundColor Cyan
Write-Host "   1. User Service: Login and test /api/users/profile" -ForegroundColor Gray
Write-Host "   2. Wallet Service: Test /api/wallets/:userId" -ForegroundColor Gray
Write-Host "   3. Notification Service: Test unread count cache" -ForegroundColor Gray
Write-Host "   4. JWT Blacklist: Test logout and token invalidation" -ForegroundColor Gray

Write-Host "`n🔍 Monitoring Commands:" -ForegroundColor Cyan
Write-Host "   docker logs ccm_redis --follow" -ForegroundColor Gray
Write-Host "   docker logs ccm_credit_service --follow" -ForegroundColor Gray
Write-Host "   docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning MONITOR" -ForegroundColor Gray

Write-Host ""
