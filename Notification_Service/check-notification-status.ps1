# Simplified E2E Test - Check existing payment notifications

Write-Host "=== NOTIFICATION SERVICE E2E STATUS CHECK ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check Payment Service outbox
Write-Host "[1] Payment Service - Recent published events:" -ForegroundColor Yellow
docker exec payment_service-mysql-1 mysql -uroot -proot payment_service_db -e "SELECT id, eventType, aggregateId, status, publishedAt FROM outbox_events WHERE status='PUBLISHED' ORDER BY publishedAt DESC LIMIT 5;" 2>$null

Write-Host ""

# 2. Check Notification Service logs for received events  
Write-Host "[2] Notification Service - Event consumption logs:" -ForegroundColor Yellow
docker logs notification_service_app --since 1h 2>&1 | Select-String -Pattern "Received event|Processing notification|Notification sent" | Select-Object -Last 10

Write-Host ""

# 3. Check created notifications
Write-Host "[3] Notifications in database:" -ForegroundColor Yellow
docker exec notification_service_mysql mysql -uroot -proot notification_service_db -e "SELECT id, user_id, type, channel, title, LEFT(message, 50) as message, status, created_at FROM notifications ORDER BY created_at DESC LIMIT 10;" 2>$null

Write-Host ""

# 4. WebSocket status
Write-Host "[4] WebSocket connections:" -ForegroundColor Yellow
docker logs notification_service_app --since 5m 2>&1 | Select-String -Pattern "Client connected|Active users" | Select-Object -Last 5

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "- Payment events are being published: CHECK ABOVE" -ForegroundColor White
Write-Host "- Notification Service listening: $(if (docker ps --filter 'name=notification_service_app' --format '{{.Status}}' | Select-String 'Up') { 'YES' } else { 'NO' })" -ForegroundColor White
Write-Host "- RabbitMQ connection: CHECK LOG [2]" -ForegroundColor White
Write-Host ""
Write-Host "To trigger new notification: Make a real payment via frontend" -ForegroundColor Magenta
Write-Host "Or use: .\test-notification-direct.ps1" -ForegroundColor White
