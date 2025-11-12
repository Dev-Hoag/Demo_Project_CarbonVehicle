# Test Frontend and Backend Integration
# Run this script to verify everything is working

Write-Host "=== CCM Frontend & Backend Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend gateway is running
Write-Host "[1] Testing Backend Gateway..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200 -or $response.StatusCode -eq 404) {
        Write-Host "✓ Gateway is running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Gateway is NOT running on port 80" -ForegroundColor Red
    Write-Host "  Please start: docker-compose up -d gateway" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Check User Service health
Write-Host "[2] Testing User Service..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:80/api/users/health" -Method GET -TimeoutSec 5
    Write-Host "✓ User Service is healthy" -ForegroundColor Green
} catch {
    Write-Host "✗ User Service health check failed" -ForegroundColor Red
}

Write-Host ""

# Test 3: Check Payment Service
Write-Host "[3] Testing Payment Service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/api/payments" -Method GET -TimeoutSec 5
    Write-Host "✓ Payment Service is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Payment Service check failed" -ForegroundColor Red
}

Write-Host ""

# Test 4: Check Wallet Service
Write-Host "[4] Testing Wallet Service..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80/api/wallets" -Method GET -TimeoutSec 5
    Write-Host "✓ Wallet Service is accessible" -ForegroundColor Green
} catch {
    Write-Host "✗ Wallet Service check failed" -ForegroundColor Red
}

Write-Host ""

# Test 5: Test Auth Registration
Write-Host "[5] Testing Auth Registration..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Random)@test.com"
$registerBody = @{
    email = $testEmail
    password = "Test123456"
    fullName = "Test User"
    phoneNumber = "1234567890"
    userType = "BUYER"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:80/api/auth/register" `
        -Method POST `
        -Body $registerBody `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    Write-Host "✓ Registration successful" -ForegroundColor Green
    Write-Host "  Email: $testEmail" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "✓ Registration endpoint working (user exists)" -ForegroundColor Green
    } else {
        Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# Test 6: Check Frontend
Write-Host "[6] Testing Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Frontend is running on http://localhost:5173" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend is NOT running" -ForegroundColor Red
    Write-Host "  Please start: npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend Gateway:  http://localhost:80" -ForegroundColor White
Write-Host "Frontend:         http://localhost:5173" -ForegroundColor White
Write-Host "API Docs (User):  http://localhost:3001/api" -ForegroundColor White
Write-Host "API Docs (Pay):   http://localhost:3002/api" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "2. Register a new account" -ForegroundColor White
Write-Host "3. Login with your credentials" -ForegroundColor White
Write-Host "4. Test Wallet and Payment features" -ForegroundColor White
Write-Host ""
