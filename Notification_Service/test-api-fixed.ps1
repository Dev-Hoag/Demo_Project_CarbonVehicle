# Notification Service Test Scripts

Write-Host "Notification Service Test Suite" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3010"
$testUserId = "test-user-$(Get-Random -Minimum 1000 -Maximum 9999)"

# Test 1: Health Check
Write-Host "1. Testing service availability..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/notifications?userId=$testUserId&page=1&limit=5" -Method GET -ErrorAction Stop
    Write-Host "[OK] Service is running!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Service not available. Make sure it's running: npm run start:dev" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Register Device Token
Write-Host "2. Registering test device token..." -ForegroundColor Yellow
$deviceToken = "fKz9_XrN0E4:APA91bH-test-token-" + (Get-Random -Minimum 10000 -Maximum 99999)
$registerBody = @{
    userId = $testUserId
    token = $deviceToken
    deviceType = "ANDROID"
    deviceName = "PowerShell Test Device"
} | ConvertTo-Json

try {
    $device = Invoke-RestMethod -Uri "$baseUrl/api/notifications/register-device" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "[OK] Device registered:" -ForegroundColor Green
    Write-Host "   User ID: $($device.userId)" -ForegroundColor Gray
    Write-Host "   Device Type: $($device.deviceType)" -ForegroundColor Gray
    Write-Host "   Token: $($device.token.Substring(0, 30))..." -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to register device: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Send Test Notification
Write-Host "3. Sending test push notification..." -ForegroundColor Yellow
$notificationBody = @{
    userId = $testUserId
    type = "SYSTEM_ALERT"
    channel = "PUSH"
    title = "Test Notification"
    message = "This is a test push notification from PowerShell test script"
    data = @{
        testId = "test-" + (Get-Random)
        timestamp = (Get-Date).ToString("o")
        screen = "home"
    }
} | ConvertTo-Json

try {
    $notification = Invoke-RestMethod -Uri "$baseUrl/api/notifications/test" -Method POST -ContentType "application/json" -Body $notificationBody
    Write-Host "[OK] Notification sent:" -ForegroundColor Green
    Write-Host "   ID: $($notification.id)" -ForegroundColor Gray
    Write-Host "   Status: $($notification.status)" -ForegroundColor Gray
    Write-Host "   Title: $($notification.title)" -ForegroundColor Gray
    Write-Host "   Channel: $($notification.channel)" -ForegroundColor Gray
    $notificationId = $notification.id
} catch {
    Write-Host "[ERROR] Failed to send notification: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Get Notifications
Write-Host "4. Retrieving user notifications..." -ForegroundColor Yellow
try {
    $notifications = Invoke-RestMethod -Uri "$baseUrl/api/notifications?userId=$testUserId&page=1&limit=10" -Method GET
    Write-Host " Retrieved notifications:" -ForegroundColor Green
    Write-Host "   Total: $($notifications.total)" -ForegroundColor Gray
    Write-Host "   Current page: $($notifications.data.Count) items" -ForegroundColor Gray
} catch {
    Write-Host " Failed to get notifications: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get Unread Count
Write-Host "5  Checking unread count..." -ForegroundColor Yellow
try {
    $unread = Invoke-RestMethod -Uri "$baseUrl/api/notifications/unread?userId=$testUserId" -Method GET
    Write-Host " Unread count: $($unread.count)" -ForegroundColor Green
} catch {
    Write-Host " Failed to get unread count: $_" -ForegroundColor Red
}

Write-Host ""

# Test 6: Mark as Read
if ($notificationId) {
    Write-Host "6  Marking notification as read..." -ForegroundColor Yellow
    try {
        $marked = Invoke-RestMethod -Uri "$baseUrl/api/notifications/$notificationId/read?userId=$testUserId" -Method PUT
        Write-Host " Notification marked as read:" -ForegroundColor Green
        Write-Host "   Status: $($marked.status)" -ForegroundColor Gray
        Write-Host "   Read at: $($marked.readAt)" -ForegroundColor Gray
    } catch {
        Write-Host " Failed to mark as read: $_" -ForegroundColor Red
    }
} else {
    Write-Host "6  Skipping mark as read (no notification ID)" -ForegroundColor Yellow
}

Write-Host ""

# Test 7: Get Preferences
Write-Host "7  Getting user preferences..." -ForegroundColor Yellow
try {
    $prefs = Invoke-RestMethod -Uri "$baseUrl/api/notifications/preferences?userId=$testUserId" -Method GET
    Write-Host " User preferences:" -ForegroundColor Green
    Write-Host "   Email: $($prefs.emailEnabled)" -ForegroundColor Gray
    Write-Host "   SMS: $($prefs.smsEnabled)" -ForegroundColor Gray
    Write-Host "   Push: $($prefs.pushEnabled)" -ForegroundColor Gray
    Write-Host "   In-App: $($prefs.inAppEnabled)" -ForegroundColor Gray
} catch {
    Write-Host " Failed to get preferences: $_" -ForegroundColor Red
}

Write-Host ""

# Test 8: Update Preferences
Write-Host "8  Updating preferences..." -ForegroundColor Yellow
$prefsBody = @{
    emailEnabled = $false
    pushEnabled = $true
    smsEnabled = $false
    inAppEnabled = $true
} | ConvertTo-Json

try {
    $updated = Invoke-RestMethod -Uri "$baseUrl/api/notifications/preferences?userId=$testUserId" -Method PUT -ContentType "application/json" -Body $prefsBody
    Write-Host " Preferences updated:" -ForegroundColor Green
    Write-Host "   Email: $($updated.emailEnabled)" -ForegroundColor Gray
    Write-Host "   Push: $($updated.pushEnabled)" -ForegroundColor Gray
} catch {
    Write-Host " Failed to update preferences: $_" -ForegroundColor Red
}

Write-Host ""

# Test 9: Internal Send (with template)
Write-Host "9  Testing internal notification (template-based)..." -ForegroundColor Yellow
$internalBody = @{
    userId = $testUserId
    templateCode = "TRIP_VERIFIED"
    variables = @{
        tripId = "trip-" + (Get-Random)
        distance = "120"
        credits = "50"
    }
    channels = @("PUSH", "IN_APP")
} | ConvertTo-Json

try {
    $internal = Invoke-RestMethod -Uri "$baseUrl/internal/notifications/send" -Method POST -ContentType "application/json" -Body $internalBody
    Write-Host " Internal notification sent:" -ForegroundColor Green
    Write-Host "   Count: $($internal.Count) notifications" -ForegroundColor Gray
    foreach ($notif in $internal) {
        Write-Host "   - Channel: $($notif.channel), Status: $($notif.status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  Internal notification may have failed (template not found is expected): $_" -ForegroundColor Yellow
}

Write-Host ""

# Test 10: Notification History
Write-Host " Getting notification history..." -ForegroundColor Yellow
try {
    $history = Invoke-RestMethod -Uri "$baseUrl/api/notifications/history?userId=$testUserId&days=30" -Method GET
    Write-Host " Notification history retrieved:" -ForegroundColor Green
    Write-Host "   Total: $($history.Count) notifications in last 30 days" -ForegroundColor Gray
} catch {
    Write-Host " Failed to get history: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Test suite completed!" -ForegroundColor Green
Write-Host "Test User ID: $testUserId" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check database: SELECT * FROM notifications WHERE user_id = '$testUserId';" -ForegroundColor Gray
Write-Host "  2. Check logs: docker-compose logs -f notification-service" -ForegroundColor Gray
Write-Host "  3. Test with real mobile app FCM token" -ForegroundColor Gray
Write-Host ""

