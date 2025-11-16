# Simple test - Create notification via Internal API
# This bypasses RabbitMQ and directly creates a notification

$body = @{
    userId = "1"
    templateCode = "PAYMENT_COMPLETED"
    variables = @{
        paymentCode = "PAY_TEST_MANUAL"
        amount = 500000
        currency = "VND"
        orderInfo = "Manual test payment notification"
    }
    channels = @("PUSH", "IN_APP")
} | ConvertTo-Json

Write-Host "Sending notification via Internal API..." -ForegroundColor Cyan

$response = Invoke-RestMethod -Uri "http://localhost:3010/internal/notifications/send" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

Write-Host "SUCCESS - Notification created!" -ForegroundColor Green
$response | ConvertTo-Json -Depth 5

Write-Host ""
Write-Host "Check frontend notification bell - should appear in real-time!" -ForegroundColor Magenta
