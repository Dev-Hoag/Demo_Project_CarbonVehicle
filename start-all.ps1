# Start all services
Write-Host "Starting all Carbon Credit Marketplace services..." -ForegroundColor Cyan
docker-compose -f docker-compose.full.yml up -d

Write-Host ""
Write-Host "Waiting for services to initialize (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

Write-Host ""
Write-Host "Service Status:" -ForegroundColor Green
docker-compose -f docker-compose.full.yml ps

Write-Host ""
Write-Host "All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "  - API Gateway: http://localhost" -ForegroundColor White
Write-Host "  - RabbitMQ Management: http://localhost:15672" -ForegroundColor White
Write-Host "  - Frontend (run separately): http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "To view logs: docker-compose -f docker-compose.full.yml logs -f" -ForegroundColor Gray
