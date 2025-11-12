# Test Script for All Services
Write-Host "`n========================================"
Write-Host "CARBON CREDIT MARKET - SERVICES TEST"
Write-Host "========================================`n"

function Test-Endpoint {
    param([string]$Name, [string]$Url, [string]$Method = "GET", [string]$Body = $null)
    
    Write-Host "`nTesting: $Name" -ForegroundColor Yellow
    Write-Host "  URL: $Url"
    
    try {
        $params = @{ Uri = $Url; Method = $Method; UseBasicParsing = $true }
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        Write-Host "  Status: $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Content.Length -lt 300) {
            Write-Host "  Response: $($response.Content)"
        }
        return $response
    } catch {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ==================== USER SERVICE ====================
Write-Host "`n[1] USER SERVICE (Port 3001)" -ForegroundColor Cyan
Test-Endpoint "Swagger Docs" "http://localhost:3001/api/docs"

$randomEmail = "test$(Get-Random)@test.com"
$registerBody = @{
    email = $randomEmail
    password = "Test123456!"
    fullName = "Test User"
    phoneNumber = "0901234567"
    userType = "EV_OWNER"
} | ConvertTo-Json

Test-Endpoint "Register User" "http://localhost:3001/api/auth/register" "POST" $registerBody

# ==================== ADMIN SERVICE ====================
Write-Host "`n[2] ADMIN SERVICE (Port 3000)" -ForegroundColor Cyan
Test-Endpoint "Health Check" "http://localhost:3000/health"

# ==================== PAYMENT SERVICE ====================
Write-Host "`n[3] PAYMENT SERVICE (Port 3002)" -ForegroundColor Cyan
Test-Endpoint "Swagger Docs" "http://localhost:3002/api/docs"
Test-Endpoint "Health Check" "http://localhost:3002/health"

# ==================== WALLET SERVICE ====================
Write-Host "`n[4] WALLET SERVICE (Port 3008)" -ForegroundColor Cyan
Test-Endpoint "Health Check" "http://localhost:3008/health"

# ==================== API GATEWAY ====================
Write-Host "`n[5] API GATEWAY (Port 80)" -ForegroundColor Cyan
Test-Endpoint "Gateway Register" "http://localhost/api/auth/register" "POST" $registerBody

# ==================== RABBITMQ ====================
Write-Host "`n[6] RABBITMQ (Port 15672)" -ForegroundColor Cyan
Test-Endpoint "Management UI" "http://localhost:15672"

Write-Host "`n========================================"
Write-Host "SERVICES STATUS"
Write-Host "========================================`n"
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}" | Select-String "service|gateway|rabbitmq"

Write-Host "`nTesting Complete!`n" -ForegroundColor Green
