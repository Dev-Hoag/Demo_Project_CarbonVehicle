# Add RabbitMQ to Listing Service and Credit Service
Write-Host "=== Adding RabbitMQ Support to Java Services ===" -ForegroundColor Green

# Listing Service
Write-Host "`n1. Updating Listing Service..." -ForegroundColor Cyan
$listingPom = "c:\Study\BuildAppOOP\CreditCarbonMarket\listing-service\pom.xml"
$listingConfig = "c:\Study\BuildAppOOP\CreditCarbonMarket\listing-service\src\main\resources\application.yaml"

# Credit Service  
Write-Host "`n2. Updating Credit Service..." -ForegroundColor Cyan
$creditPom = "c:\Study\BuildAppOOP\CreditCarbonMarket\credit-service\pom.xml"
$creditConfig = "c:\Study\BuildAppOOP\CreditCarbonMarket\credit-service\src\main\resources\application.yaml"

Write-Host "`nDone! Files to update:" -ForegroundColor Yellow
Write-Host "- listing-service/pom.xml" -ForegroundColor Gray
Write-Host "- listing-service/application.yaml" -ForegroundColor Gray
Write-Host "- credit-service/pom.xml" -ForegroundColor Gray
Write-Host "- credit-service/application.yaml" -ForegroundColor Gray
