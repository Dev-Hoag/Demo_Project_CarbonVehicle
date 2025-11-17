# Restart all services (rebuild if needed)
param(
    [switch]$Build
)

Write-Host "Restarting all Carbon Credit Marketplace services..." -ForegroundColor Cyan

if ($Build) {
    Write-Host "Rebuilding images..." -ForegroundColor Yellow
    docker-compose -f docker-compose.full.yml down
    docker-compose -f docker-compose.full.yml up -d --build
} else {
    docker-compose -f docker-compose.full.yml restart
}

Write-Host ""
Write-Host "Waiting for services to stabilize (15 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "Service Status:" -ForegroundColor Green
docker-compose -f docker-compose.full.yml ps

Write-Host ""
Write-Host "All services restarted!" -ForegroundColor Green
