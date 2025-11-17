# Check status of all services
Write-Host "Carbon Credit Marketplace - Service Status" -ForegroundColor Cyan
Write-Host ""

# Container status
Write-Host "Container Status:" -ForegroundColor Yellow
docker-compose -f docker-compose.full.yml ps

Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Yellow

# Check databases
$databases = @(
    "user_service_mysql",
    "admin_service_mysql",
    "payment_service_mysql",
    "transaction_service_mysql",
    "ccm_wallet_mysql",
    "notification_service_mysql",
    "mysql-trip-service",
    "mysql-listing-service",
    "mysql-credit-service"
)

foreach ($db in $databases) {
    $health = docker inspect $db --format='{{.State.Health.Status}}' 2>$null
    if ($health) {
        $color = if ($health -eq "healthy") { "Green" } else { "Red" }
        Write-Host "  $db : $health" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "RabbitMQ Status:" -ForegroundColor Yellow
$rabbitmqHealth = docker inspect ccm_rabbitmq --format='{{.State.Health.Status}}' 2>$null
if ($rabbitmqHealth) {
    $color = if ($rabbitmqHealth -eq "healthy") { "Green" } else { "Red" }
    Write-Host "  RabbitMQ: $rabbitmqHealth" -ForegroundColor $color
}

Write-Host ""
Write-Host "Gateway Status:" -ForegroundColor Yellow
$gatewayStatus = docker inspect api_gateway --format='{{.State.Status}}' 2>$null
if ($gatewayStatus) {
    $color = if ($gatewayStatus -eq "running") { "Green" } else { "Red" }
    Write-Host "  API Gateway: $gatewayStatus" -ForegroundColor $color
}

Write-Host ""
Write-Host "Quick Commands:" -ForegroundColor Cyan
Write-Host "  View logs: docker-compose -f docker-compose.full.yml logs -f [service-name]" -ForegroundColor Gray
Write-Host "  Restart service: docker-compose -f docker-compose.full.yml restart [service-name]" -ForegroundColor Gray
Write-Host "  Rebuild service: docker-compose -f docker-compose.full.yml up -d --build [service-name]" -ForegroundColor Gray
