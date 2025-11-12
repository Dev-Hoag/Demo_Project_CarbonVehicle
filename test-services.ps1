# Test Script for All Services
# Run: .\test-services.ps1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "CARBON CREDIT MARKET - SERVICES TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Url" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            UseBasicParsing = $true
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "  ✓ Status: $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Content.Length -lt 500) {
            Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
        } else {
            Write-Host "  Response: [$(($response.Content.Length)) bytes]" -ForegroundColor Gray
        }
        
        return $response
    }
    catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "  Status: $statusCode" -ForegroundColor Red
        }
        return $null
    }
    finally {
        Write-Host ""
    }
}

# ==================== 1. USER SERVICE ====================
Write-Host "`n[1] USER SERVICE (Port 3001)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Test-Endpoint "Swagger Documentation" "http://localhost:3001/api/docs"
Test-Endpoint "Internal Swagger" "http://localhost:3001/api/docs-internal"

# Register a new user
$randomEmail = "testuser_$(Get-Random)@test.com"
$registerBody = @{
    email = $randomEmail
    password = "Test123456!"
    fullName = "Test User"
    phoneNumber = "0901234567"
    userType = "EV_OWNER"
} | ConvertTo-Json

$registerResponse = Test-Endpoint "Register New User" "http://localhost:3001/api/auth/register" "POST" $registerBody

# Try to login (might fail if email verification required)
$loginBody = @{
    email = $randomEmail
    password = "Test123456!"
} | ConvertTo-Json

Test-Endpoint "Login User" "http://localhost:3001/api/auth/login" "POST" $loginBody

# ==================== 2. ADMIN SERVICE ====================
Write-Host "`n[2] ADMIN SERVICE (Port 3000)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Test-Endpoint "Service Health" "http://localhost:3000/health"
Test-Endpoint "Swagger Documentation" "http://localhost:3000/docs"

# ==================== 3. PAYMENT SERVICE ====================
Write-Host "`n[3] PAYMENT SERVICE (Port 3002)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Test-Endpoint "Service Health" "http://localhost:3002/health"
Test-Endpoint "Swagger Documentation" "http://localhost:3002/api/docs"

# ==================== 4. WALLET SERVICE ====================
Write-Host "`n[4] WALLET SERVICE (Port 3008)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Test-Endpoint "Service Health" "http://localhost:3008/health"
Test-Endpoint "Swagger Documentation" "http://localhost:3008/docs"

# ==================== 5. API GATEWAY ====================
Write-Host "`n[5] API GATEWAY (Port 80)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Test-Endpoint "Gateway - User Register" "http://localhost/api/auth/register" "POST" $registerBody
Test-Endpoint "Gateway - User Login" "http://localhost/api/auth/login" "POST" $loginBody

# ==================== 6. RABBITMQ ====================
Write-Host "`n[6] RABBITMQ (Port 15672)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Test-Endpoint "RabbitMQ Management UI" "http://localhost:15672"

# ==================== SUMMARY ====================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nServices Status:" -ForegroundColor Yellow
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -match "service|gateway|rabbitmq" }

Write-Host "`n✓ Testing Complete!" -ForegroundColor Green
Write-Host "`nSwagger URLs:" -ForegroundColor Yellow
Write-Host "  - User Service:    http://localhost:3001/api/docs" -ForegroundColor Gray
Write-Host "  - Admin Service:   http://localhost:3000/docs (if available)" -ForegroundColor Gray
Write-Host "  - Payment Service: http://localhost:3002/api/docs" -ForegroundColor Gray
Write-Host "  - Wallet Service:  http://localhost:3008/docs (if available)" -ForegroundColor Gray
Write-Host "  - RabbitMQ UI:     http://localhost:15672 (guest/guest)" -ForegroundColor Gray
Write-Host ""
