# End-to-end test: Simulate Payment Service publishing payment.completed event

Write-Host "=== END-TO-END NOTIFICATION TEST ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Insert event into Payment Service outbox
Write-Host "[1/4] Creating test payment event in Payment Service outbox..." -ForegroundColor Yellow

$paymentCode = "PAY_E2E_TEST_$(Get-Date -Format 'HHmmss')"
$eventId = "e2e-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
$timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

$eventJson = @{
    id = $eventId
    type = "payment.completed"
    version = 1
    source = "payment-service"
    aggregateId = $paymentCode
    timestamp = $timestamp
    payload = @{
        paymentCode = $paymentCode
        transactionId = "txn-e2e-test"
        userId = "1"
        gateway = "VNPAY"
        amount = 999000
        currency = "VND"
        orderInfo = "E2E Test - Real-time notification flow"
        gatewayTransactionId = "E2E123"
        gatewayResponseCode = "00"
        completedAt = $timestamp
    }
    metadata = @{
        correlationId = "e2e-corr-$(Get-Date -Format 'HHmmss')"
        actor = "test-script"
        retries = 0
    }
} | ConvertTo-Json -Depth 10 -Compress

# Escape for SQL
$escapedPayload = $eventJson.Replace("'", "''").Replace('"', '\"')

# Insert into outbox
$insertSql = "INSERT INTO outbox_events (eventId, aggregateType, aggregateId, eventType, payload, routingKey, exchange, topic, status, retryCount, maxRetries, createdAt, updatedAt) VALUES ('$eventId', 'payment-service', '$paymentCode', 'payment.completed', '$escapedPayload', 'payment.completed', 'ccm.events', 'payment.completed', 'PENDING', 0, 5, NOW(), NOW());"

docker exec -i payment_service-mysql-1 mysql -uroot -proot payment_service_db -e "$insertSql" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   SUCCESS - Event inserted into outbox" -ForegroundColor Green
} else {
    Write-Host "   FAILED - Could not insert event" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/4] Waiting for Payment Service OutboxPublisher to publish event (10s)..." -ForegroundColor Yellow
Write-Host "   Watching Payment Service logs..." -ForegroundColor Gray
Start-Sleep -Seconds 12

# Check if event was published
$publishCheck = docker exec payment_service-mysql-1 mysql -uroot -proot payment_service_db -e "SELECT status FROM outbox_events WHERE eventId='$eventId';" 2>$null | Select-String "PUBLISHED"

if ($publishCheck) {
    Write-Host "   SUCCESS - Event published to RabbitMQ" -ForegroundColor Green
} else {
    Write-Host "   WARNING - Event may not be published yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[3/4] Checking if Notification Service received event..." -ForegroundColor Yellow

# Check notification service logs
$notifLogs = docker logs notification_service_app --since 30s 2>&1 | Select-String -Pattern "payment\.completed|Processing notification" | Select-Object -Last 3

if ($notifLogs) {
    Write-Host "   SUCCESS - Notification Service processed event:" -ForegroundColor Green
    $notifLogs | ForEach-Object { Write-Host "      $_" -ForegroundColor Gray }
} else {
    Write-Host "   No logs found - check manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4/4] Checking if notification was created..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

$notificationCheck = docker exec notification_service_mysql mysql -uroot -proot notification_service_db -e "SELECT id, user_id, type, title, message, status FROM notifications WHERE message LIKE '%E2E Test%' ORDER BY created_at DESC LIMIT 1;" 2>$null

if ($notificationCheck) {
    Write-Host "   SUCCESS - Notification created in database!" -ForegroundColor Green
    Write-Host $notificationCheck -ForegroundColor Gray
} else {
    Write-Host "   No notification found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open frontend and check notification bell!" -ForegroundColor Magenta
Write-Host "Or check: http://localhost:3010/api/notifications?userId=1" -ForegroundColor White
