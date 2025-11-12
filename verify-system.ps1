# Quick Verification Test
Write-Host "=== Carbon Credit Marketplace - System Verification ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check all backend services
Write-Host "1. Checking Backend Services..." -ForegroundColor Yellow
$services = @(
    @{Name="Admin Service"; Port=3000},
    @{Name="User Service"; Port=3001},
    @{Name="Payment Service"; Port=3002},
    @{Name="Wallet Service"; Port=3008},
    @{Name="API Gateway"; Port=80}
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "   ✅ $($service.Name) (Port $($service.Port))" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($service.Name) (Port $($service.Port)) - NOT RESPONDING" -ForegroundColor Red
    }
}

Write-Host ""

# Test 2: Check CORS headers
Write-Host "2. Checking CORS Configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        'Origin' = 'http://localhost:5173'
        'Authorization' = 'Bearer test'
    }
    $response = Invoke-WebRequest -Uri 'http://localhost/api/health' -Headers $headers -ErrorAction Stop
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    
    if ($corsHeader -eq 'http://localhost:5173') {
        Write-Host "   ✅ CORS headers correct (single value)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  CORS header: $corsHeader" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ CORS check failed" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check databases
Write-Host "3. Checking Database Containers..." -ForegroundColor Yellow
$databases = docker ps --format "{{.Names}}" | Select-String "mysql"
foreach ($db in $databases) {
    $status = docker inspect $db --format '{{.State.Health.Status}}' 2>$null
    if ($status -eq 'healthy' -or $status -eq '') {
        Write-Host "   ✅ $db" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  $db - Status: $status" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test 4: Check RabbitMQ
Write-Host "4. Checking RabbitMQ..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:15672' -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ RabbitMQ Management UI accessible" -ForegroundColor Green
} catch {
    Write-Host "   ❌ RabbitMQ not responding" -ForegroundColor Red
}

Write-Host ""

# Test 5: Check Frontend
Write-Host "5. Checking Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5173' -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Frontend dev server running" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Frontend not running - Start with: cd CCM-Frontend; npm run dev" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Verification Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Quick Access URLs:" -ForegroundColor Yellow
Write-Host "  • Frontend:      http://localhost:5173/" -ForegroundColor White
Write-Host "  • API Gateway:   http://localhost/api/" -ForegroundColor White
Write-Host "  • RabbitMQ:      http://localhost:15672/" -ForegroundColor White
Write-Host "  • User Swagger:  http://localhost:3001/api/docs" -ForegroundColor White
Write-Host ""
