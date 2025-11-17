# Stop all services
Write-Host "Stopping all Carbon Credit Marketplace services..." -ForegroundColor Cyan
docker-compose -f docker-compose.full.yml down

Write-Host ""
Write-Host "All services stopped!" -ForegroundColor Green
Write-Host ""
Write-Host "To remove volumes as well (DELETES ALL DATA): docker-compose -f docker-compose.full.yml down -v" -ForegroundColor Yellow
