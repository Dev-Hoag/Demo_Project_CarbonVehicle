# Test Credit Issued Event
Write-Host "Testing Credit Issued Event..." -ForegroundColor Cyan

$body = @{
    userId = "3bd9b3c0-7ec5-4c6f-bd95-9f4e8c123456"
    amount = 15.75
    source = "EARNED_FROM_TRIP"
    description = "Test credit event via RabbitMQ"
    referenceId = "test-ref-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8093/api/v1/credits/add" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "`n✅ Success!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 5
    
    Write-Host "`n📬 Check notification_service logs for credit.issued event processing" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    Write-Host "`nChecking credit-service logs..." -ForegroundColor Yellow
    docker logs evowner-credit-service --tail 30
}
