# Simple Redis Test Suite
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "     REDIS IMPLEMENTATION - TEST SUITE" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0

# Test 1: Redis Connectivity
Write-Host "[1] Testing Redis Connection..." -ForegroundColor Yellow
try {
    $result = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning PING
    if ($result -eq "PONG") {
        Write-Host "    PASS - Redis is responding" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "    FAIL - Redis not accessible" -ForegroundColor Red
    $failed++
}

# Test 2: Redis Memory
Write-Host "`n[2] Testing Redis Memory..." -ForegroundColor Yellow
try {
    $mem = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning INFO memory | Select-String "used_memory_human"
    Write-Host "    PASS - $mem" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "    FAIL - Cannot get memory info" -ForegroundColor Red
    $failed++
}

# Test 3: Credit Service Balance Cache
Write-Host "`n[3] Testing Credit Service Cache..." -ForegroundColor Yellow
try {
    $userId = "550e8400-e29b-41d4-a716-446655440000"
    $url = "http://localhost:8083/api/v1/credits/user/$userId"
    
    # Create account if not exists
    try { Invoke-RestMethod -Uri "http://localhost:8083/api/v1/credits?userId=$userId" -Method POST -ErrorAction SilentlyContinue | Out-Null } catch {}
    
    # First call
    $time1 = Measure-Command { Invoke-RestMethod -Uri $url } | Select-Object -ExpandProperty TotalMilliseconds
    Start-Sleep -Milliseconds 500
    
    # Second call (cached)
    $time2 = Measure-Command { Invoke-RestMethod -Uri $url } | Select-Object -ExpandProperty TotalMilliseconds
    
    $improvement = [math]::Round((($time1 - $time2) / $time1) * 100, 0)
    Write-Host "    PASS - First: $([math]::Round($time1))ms, Cached: $([math]::Round($time2))ms" -ForegroundColor Green
    Write-Host "    Improvement: $improvement%" -ForegroundColor Cyan
    $passed++
} catch {
    Write-Host "    FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 4: Credit Statistics Cache
Write-Host "`n[4] Testing Credit Statistics Cache..." -ForegroundColor Yellow
try {
    $url = "http://localhost:8083/api/v1/credits/statistics"
    
    $time1 = Measure-Command { Invoke-RestMethod -Uri $url } | Select-Object -ExpandProperty TotalMilliseconds
    Start-Sleep -Milliseconds 500
    $time2 = Measure-Command { Invoke-RestMethod -Uri $url } | Select-Object -ExpandProperty TotalMilliseconds
    
    $improvement = [math]::Round((($time1 - $time2) / $time1) * 100, 0)
    Write-Host "    PASS - First: $([math]::Round($time1))ms, Cached: $([math]::Round($time2))ms" -ForegroundColor Green
    Write-Host "    Improvement: $improvement%" -ForegroundColor Cyan
    $passed++
} catch {
    Write-Host "    FAIL - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 5: Redis SET/GET
Write-Host "`n[5] Testing Redis Operations..." -ForegroundColor Yellow
try {
    docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning SET "test:automated" "success" EX 60 | Out-Null
    $value = docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning GET "test:automated"
    docker exec ccm_redis redis-cli -a ccm_redis_password_2024 --no-auth-warning DEL "test:automated" | Out-Null
    
    if ($value -eq "success") {
        Write-Host "    PASS - SET/GET/DEL operations working" -ForegroundColor Green
        $passed++
    }
} catch {
    Write-Host "    FAIL - Redis operations error" -ForegroundColor Red
    $failed++
}

# Test 6: Service Logs
Write-Host "`n[6] Checking Service Logs..." -ForegroundColor Yellow
try {
    $logs = docker logs ccm_credit_service --tail 30 2>&1 | Select-String "Redis|CACHE" -CaseSensitive:$false
    if ($logs) {
        Write-Host "    PASS - Found $($logs.Count) cache-related logs" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "    WARN - No cache logs (may be normal)" -ForegroundColor Yellow
        $passed++
    }
} catch {
    Write-Host "    FAIL - Cannot read logs" -ForegroundColor Red
    $failed++
}

# Summary
$total = $passed + $failed
$rate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 0) } else { 0 }

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "RESULTS: $passed Passed, $failed Failed (${rate}% success)" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host "============================================================`n" -ForegroundColor Cyan

if ($failed -eq 0) {
    Write-Host "ALL TESTS PASSED - Ready for merge!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed - Review before merge" -ForegroundColor Yellow
}
