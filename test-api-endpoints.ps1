# Comprehensive API Test Script
# Tests all service endpoints with real data

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "API ENDPOINTS TEST - ALL SERVICES" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$global:token = $null
$global:userId = $null

function Test-API {
    param([string]$Name, [string]$Url, [string]$Method = "GET", [object]$Body = $null, [string]$Token = $null)
    
    Write-Host "`n[$Method] $Name" -ForegroundColor Yellow
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $headers = @{}
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
            Write-Host "Body: $($params.Body)" -ForegroundColor Gray
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "Status: $($response.StatusCode) OK" -ForegroundColor Green
        
        $content = $response.Content | ConvertFrom-Json
        Write-Host "Response: $($response.Content.Substring(0, [Math]::Min(300, $response.Content.Length)))" -ForegroundColor Gray
        
        return $content
    } catch {
        $statusCode = "Error"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        Write-Host "Status: $statusCode - $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ==================== USER SERVICE ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "1. USER SERVICE - Authentication & Profile" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1.1 Register
$registerData = @{
    email = "apitest_$(Get-Random)@test.com"
    password = "Test123456!"
    fullName = "API Test User"
    phoneNumber = "0$(Get-Random -Minimum 900000000 -Maximum 999999999)"
    userType = "EV_OWNER"
}
$regResult = Test-API "Register User" "http://localhost:3001/api/auth/register" "POST" $registerData

# 1.2 Login (try with admin/existing user)
$loginData = @{
    email = "admin@test.com"
    password = "Admin123456!"
}
$loginResult = Test-API "Login" "http://localhost:3001/api/auth/login" "POST" $loginData

if ($loginResult -and $loginResult.accessToken) {
    $global:token = $loginResult.accessToken
    Write-Host "`nToken acquired: $($global:token.Substring(0, 20))..." -ForegroundColor Green
    
    # 1.3 Get My Profile
    Test-API "Get My Profile" "http://localhost:3001/api/users/profile" "GET" -Token $global:token
    
    # 1.4 Get Me
    $meResult = Test-API "Auth - Get Me" "http://localhost:3001/api/auth/me" "GET" -Token $global:token
    if ($meResult) {
        $global:userId = $meResult.id
    }
} else {
    Write-Host "`nWARNING: Login failed, skipping authenticated tests" -ForegroundColor Yellow
}

# ==================== PAYMENT SERVICE ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "2. PAYMENT SERVICE - Deposit & Transactions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($global:token) {
    # 2.1 Initiate Payment
    $paymentData = @{
        userId = if ($global:userId) { $global:userId } else { 1 }
        amount = 500000
        paymentMethod = "VNPAY"
        orderInfo = "Deposit to wallet - API Test"
        language = "vn"
    }
    $paymentResult = Test-API "Initiate Payment" "http://localhost:3002/api/payments/initiate" "POST" $paymentData
    
    if ($paymentResult -and $paymentResult.paymentCode) {
        # 2.2 Get Payment Status
        Start-Sleep -Seconds 2
        Test-API "Get Payment Status" "http://localhost:3002/api/payments/$($paymentResult.paymentCode)/status" "GET" -Token $global:token
    }
    
    # 2.3 Get My Payments
    Test-API "Get My Payments" "http://localhost:3002/api/payments/my-payments?page=1&limit=5" "GET" -Token $global:token
}

# ==================== WALLET SERVICE ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "3. WALLET SERVICE - Balance & Transactions" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($global:token) {
    # 3.1 Get Wallet
    Test-API "Get My Wallet" "http://localhost:3008/api/wallets" "GET" -Token $global:token
    
    # 3.2 Get Wallet Summary
    Test-API "Get Wallet Summary" "http://localhost:3008/api/wallets/summary" "GET" -Token $global:token
    
    # 3.3 Get Withdrawal Limits
    Test-API "Get Withdrawal Limits" "http://localhost:3008/api/wallets/limits" "GET" -Token $global:token
    
    # 3.4 Get Transactions
    Test-API "Get My Transactions" "http://localhost:3008/api/transactions?page=1&limit=5" "GET" -Token $global:token
}

# ==================== ADMIN SERVICE ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "4. ADMIN SERVICE - User Management" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Note: Admin endpoints require admin role
if ($global:token) {
    # 4.1 Get All Users (might fail if not admin)
    Test-API "Admin - List Users" "http://localhost:3000/api/admin/users?page=1&limit=5" "GET" -Token $global:token
    
    # 4.2 Get Audit Logs
    Test-API "Admin - Audit Logs" "http://localhost:3000/api/admin/audit-logs?page=1&limit=5" "GET" -Token $global:token
}

# ==================== GATEWAY TESTS ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "5. API GATEWAY - Routing Tests" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 5.1 Auth via Gateway
$gwLoginData = @{
    email = "admin@test.com"
    password = "Admin123456!"
}
$gwLogin = Test-API "Gateway - Login" "http://localhost/api/auth/login" "POST" $gwLoginData

if ($gwLogin -and $gwLogin.accessToken) {
    $gwToken = $gwLogin.accessToken
    
    # 5.2 Get Profile via Gateway
    Test-API "Gateway - Get Profile" "http://localhost/api/users/profile" "GET" -Token $gwToken
    
    # 5.3 Get Wallet via Gateway
    Test-API "Gateway - Get Wallet" "http://localhost/api/wallets" "GET" -Token $gwToken
}

# ==================== SUMMARY ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Tested Services:" -ForegroundColor Yellow
Write-Host "  User Service (3001):    Authentication, Profile Management" -ForegroundColor Gray
Write-Host "  Payment Service (3002): Payment Initiation, Status Check" -ForegroundColor Gray
Write-Host "  Wallet Service (3008):  Wallet Info, Transactions" -ForegroundColor Gray
Write-Host "  Admin Service (3000):   User Management (requires admin)" -ForegroundColor Gray
Write-Host "  API Gateway (80):       Routing & Auth" -ForegroundColor Gray

Write-Host "`nSwagger Documentation:" -ForegroundColor Yellow
Write-Host "  User:    http://localhost:3001/api/docs" -ForegroundColor Cyan
Write-Host "  Payment: http://localhost:3002/api/docs" -ForegroundColor Cyan
Write-Host "  Wallet:  http://localhost:3008/docs" -ForegroundColor Cyan

Write-Host "`nTest completed!`n" -ForegroundColor Green
