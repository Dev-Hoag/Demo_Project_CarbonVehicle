# Test script - Insert payment.completed event into Payment Service outbox table
# This will be automatically published by OutboxPublisherService

Write-Host "Creating test payment.completed event..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$paymentCode = "PAY_TEST_$(Get-Date -Format 'HHmmss')"

$eventPayload = @{
    id = "test-event-$(Get-Date -Format 'yyyyMMddHHmmss')"
    type = "payment.completed"
    version = 1
    source = "payment-service"
    aggregateId = $paymentCode
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    payload = @{
        paymentCode = $paymentCode
        transactionId = "txn-test-$(Get-Date -Format 'HHmmss')"
        userId = "1"
        gateway = "VNPAY"
        amount = 500000
        currency = "VND"
        orderInfo = "🧪 Test payment for real-time notification"
        gatewayTransactionId = "TEST$(Get-Date -Format 'HHmmss')"
        gatewayResponseCode = "00"
        completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    metadata = @{
        correlationId = "test-correlation-$(Get-Date -Format 'HHmmss')"
        actor = "test-script"
        retries = 0
    }
} | ConvertTo-Json -Depth 10 -Compress

# Escape single quotes for SQL
$escapedPayload = $eventPayload.Replace("'", "''")

$sql = @"
INSERT INTO outbox_events 
(eventId, aggregateType, aggregateId, eventType, payload, routingKey, exchange, topic, status, retryCount, maxRetries, createdAt, updatedAt)
VALUES 
('test-event-$(Get-Date -Format 'yyyyMMddHHmmss')', 
 'payment-service', 
 '$paymentCode', 
 'payment.completed', 
 '$escapedPayload', 
 'payment.completed', 
 'ccm.events', 
 'payment.completed', 
 'PENDING', 
 0, 
 5, 
 NOW(), 
 NOW());
"@

Write-Host "Inserting event into outbox_events table..." -ForegroundColor Yellow
docker exec -i payment_service-mysql-1 mysql -uroot -proot payment_service_db -e "$sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS - Event inserted into outbox! Payment Service will publish it within 10 seconds." -ForegroundColor Green
    Write-Host ""
    Write-Host "Watch the logs:" -ForegroundColor Cyan
    Write-Host "  Payment Service: docker logs payment_service-payment-service-1 --tail 20 -f" -ForegroundColor White
    Write-Host "  Notification:    docker logs notification_service_app --tail 20 -f" -ForegroundColor White
    Write-Host ""
    Write-Host "Check frontend notification bell for real-time update!" -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "ERROR - Failed to insert event" -ForegroundColor Red
}
