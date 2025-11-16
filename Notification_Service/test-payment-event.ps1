# Test script to publish payment.completed event to RabbitMQ
# This simulates Payment Service emitting a payment.completed event

$eventPayload = @{
    id = "test-event-$(Get-Date -Format 'yyyyMMddHHmmss')"
    type = "payment.completed"
    version = 1
    source = "payment-service"
    aggregateId = "PAY_TEST_$(Get-Date -Format 'HHmmss')"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    payload = @{
        paymentCode = "PAY_TEST_$(Get-Date -Format 'HHmmss')"
        transactionId = "txn-test-$(Get-Date -Format 'HHmmss')"
        userId = "1"
        gateway = "VNPAY"
        amount = 500000
        currency = "VND"
        orderInfo = "Test payment for notification integration"
        gatewayTransactionId = "TEST123456"
        gatewayResponseCode = "00"
        completedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    }
    metadata = @{
        correlationId = "test-correlation-$(Get-Date -Format 'HHmmss')"
        actor = "test-script"
        retries = 0
    }
} | ConvertTo-Json -Depth 10

Write-Host "Publishing payment.completed event to RabbitMQ..." -ForegroundColor Cyan
Write-Host $eventPayload

# Publish to RabbitMQ using docker exec
$escapedPayload = $eventPayload.Replace('"', '\"')

docker exec ccm_rabbitmq rabbitmqadmin publish `
    --vhost=ccm_vhost `
    exchange=ccm.events `
    routing_key=payment.completed `
    "payload=$eventPayload"

Write-Host "`n✅ Event published! Check notification service logs:" -ForegroundColor Green
Write-Host "docker logs notification_service_app --tail 20" -ForegroundColor Yellow
