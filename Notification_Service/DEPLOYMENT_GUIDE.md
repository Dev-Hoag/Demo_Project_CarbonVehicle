# 🚀 Deployment Guide - Notification Service

## 📦 Prerequisites

- Docker & Docker Compose installed
- MySQL 8.0
- RabbitMQ 3.x
- Firebase Project với service account key
- Nginx API Gateway

---

## 🛠️ Step 1: Database Setup

### Option A: Standalone MySQL
```powershell
# 1. Start MySQL
docker run -d --name notification-mysql `
  -e MYSQL_ROOT_PASSWORD=rootpassword `
  -e MYSQL_DATABASE=notification_service_db `
  -p 3316:3306 `
  mysql:8.0

# 2. Wait for MySQL to be ready (30 seconds)
Start-Sleep -Seconds 30

# 3. Import schema
Get-Content notification_service_schema.sql | docker exec -i notification-mysql mysql -uroot -prootpassword notification_service_db

# 4. Verify tables created
docker exec -it notification-mysql mysql -uroot -prootpassword notification_service_db -e "SHOW TABLES;"
```

Expected output:
```
+----------------------------------------+
| Tables_in_notification_service_db      |
+----------------------------------------+
| device_tokens                          |
| notification_logs                      |
| notification_preferences               |
| notification_templates                 |
| notifications                          |
+----------------------------------------+
```

### Option B: Use existing MySQL
```powershell
# Import to existing MySQL instance
mysql -u root -p notification_service_db < notification_service_schema.sql
```

---

## 🐰 Step 2: RabbitMQ Setup

### Start RabbitMQ
```powershell
docker run -d --name notification-rabbitmq `
  -p 5672:5672 `
  -p 15672:15672 `
  -e RABBITMQ_DEFAULT_USER=guest `
  -e RABBITMQ_DEFAULT_PASS=guest `
  rabbitmq:3-management-alpine
```

### Verify RabbitMQ
- Management UI: http://localhost:15672
- Login: guest/guest
- Check: Queues tab should show notification_service_* queues after service starts

---

## 🔥 Step 3: Firebase Configuration

### 1. Download Service Account Key
Follow `FIREBASE_SETUP_GUIDE.md` steps 1-3 to get JSON file.

### 2. Place in config folder
```powershell
# Ensure config directory exists
if (!(Test-Path "config")) { New-Item -ItemType Directory -Path "config" }

# Copy service account key
Copy-Item "C:\Users\YOUR_USERNAME\Downloads\carbon-credit-*.json" `
  -Destination "config\firebase-service-account.json"

# Verify
if (Test-Path "config\firebase-service-account.json") {
    Write-Host "✅ Firebase key installed" -ForegroundColor Green
} else {
    Write-Host "❌ Firebase key missing!" -ForegroundColor Red
}
```

---

## 🎯 Step 4: Build & Run Service

### Development Mode
```powershell
# 1. Install dependencies
npm install

# 2. Build TypeScript
npm run build

# 3. Start in dev mode (hot reload)
npm run start:dev
```

Service should start on: http://localhost:3010

### Production Mode (Docker)
```powershell
# 1. Build Docker image
docker build -t notification-service:latest .

# 2. Run container
docker run -d --name notification-service `
  -p 3010:3010 `
  -e DB_HOST=host.docker.internal `
  -e DB_PORT=3306 `
  -e RABBITMQ_URL=amqp://guest:guest@host.docker.internal:5672 `
  -v ${PWD}/config:/app/config `
  notification-service:latest

# 3. Check logs
docker logs -f notification-service
```

### Docker Compose (Recommended)
```powershell
# Start all services (MySQL, RabbitMQ, Notification Service)
docker-compose up -d

# View logs
docker-compose logs -f notification-service

# Stop all
docker-compose down
```

---

## 🌐 Step 5: Nginx Gateway Integration

### Update docker-compose for Gateway

Add to main `docker-compose.yml` in project root:

```yaml
services:
  notification-service:
    build:
      context: ./Notification_Service
      dockerfile: Dockerfile
    container_name: notification-service
    environment:
      - NODE_ENV=production
      - PORT=3010
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_USERNAME=root
      - DB_PASSWORD=rootpassword
      - DB_NAME=notification_service_db
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
      - FIREBASE_PROJECT_ID=carbon-credit-marketplace
      - FIREBASE_SERVICE_ACCOUNT_PATH=/app/config/firebase-service-account.json
    volumes:
      - ./Notification_Service/config:/app/config
    networks:
      - app-network
    depends_on:
      - mysql
      - rabbitmq
    restart: unless-stopped
```

### Restart Gateway
```powershell
# Restart nginx to load new routes
docker restart api_gateway

# Or rebuild gateway
docker-compose -f gateway/docker-compose.yml restart

# Verify route works
curl http://localhost/api/notifications/unread?userId=test
```

---

## ✅ Step 6: Verification

### Health Checks
```powershell
# 1. Service health
Invoke-WebRequest -Uri "http://localhost:3010/api/notifications?userId=test&page=1&limit=1" | Select-Object StatusCode

# 2. Database connection
docker exec notification-service npm run start:prod 2>&1 | Select-String "Database connection"

# 3. RabbitMQ connection
docker logs notification-service 2>&1 | Select-String "Connected to RabbitMQ"

# 4. Firebase initialization
docker logs notification-service 2>&1 | Select-String "Firebase Admin SDK"
```

Expected logs:
```
✅ Firebase Admin SDK initialized
✅ Connected to RabbitMQ
📬 Listening to trip.verified events
📬 Listening to listing.created events
...
🚀 Notification Service is running on http://localhost:3010
```

### Run Test Suite
```powershell
.\test-api.ps1
```

Should output:
```
🧪 Notification Service Test Suite
==================================

1️⃣  Testing service availability...
✅ Service is running!

2️⃣  Registering test device token...
✅ Device registered:
   User ID: test-user-1234
...

✅ Test suite completed!
```

---

## 📊 Step 7: Monitoring

### Check Service Status
```powershell
# Docker status
docker ps | Select-String "notification"

# Service logs (last 100 lines)
docker logs notification-service --tail 100

# Real-time logs
docker logs -f notification-service
```

### Database Queries
```sql
-- Check notifications count
SELECT COUNT(*) as total, status, channel 
FROM notifications 
GROUP BY status, channel;

-- Check active device tokens
SELECT COUNT(*) as total, device_type 
FROM device_tokens 
WHERE is_active = 1 
GROUP BY device_type;

-- Recent notifications
SELECT * FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- User preferences
SELECT * FROM notification_preferences;

-- Notification logs (success/failure rate)
SELECT status, COUNT(*) as count 
FROM notification_logs 
GROUP BY status;
```

### RabbitMQ Monitoring
- Management UI: http://localhost:15672
- Check queues: `notification_service_*`
- Monitor message rates
- Check consumer status

---

## 🔧 Troubleshooting

### Service won't start
```powershell
# Check port 3010 is free
netstat -ano | findstr :3010

# Kill process if port is occupied
taskkill /PID <PID> /F

# Check environment variables
docker exec notification-service printenv | Select-String "DB_\|RABBITMQ\|FIREBASE"
```

### Database connection failed
```powershell
# Test MySQL connection from container
docker exec notification-service sh -c "npm install -g mysql; mysql -h$DB_HOST -u$DB_USERNAME -p$DB_PASSWORD -e 'SELECT 1'"

# Check MySQL is running
docker ps | Select-String "mysql"

# Check MySQL logs
docker logs notification-mysql --tail 50
```

### RabbitMQ connection failed
```powershell
# Test RabbitMQ connection
curl -u guest:guest http://localhost:15672/api/overview

# Check RabbitMQ logs
docker logs notification-rabbitmq --tail 50

# Restart RabbitMQ
docker restart notification-rabbitmq
```

### Firebase initialization failed
```powershell
# Check file exists in container
docker exec notification-service ls -la /app/config/firebase-service-account.json

# Check file content (first 3 lines)
docker exec notification-service head -n 3 /app/config/firebase-service-account.json

# Re-mount volume if file missing
docker-compose down
docker-compose up -d
```

### Push notifications not sending
1. Check device token registered:
   ```sql
   SELECT * FROM device_tokens WHERE user_id = 'YOUR_USER_ID';
   ```

2. Check user preferences allow push:
   ```sql
   SELECT push_enabled FROM notification_preferences WHERE user_id = 'YOUR_USER_ID';
   ```

3. Check Firebase project quotas in Firebase Console

4. Verify FCM token is valid (test with Firebase Console → Cloud Messaging → Send test message)

---

## 🚀 Production Checklist

- [ ] Environment variables set (no hardcoded passwords)
- [ ] Firebase service account key secured (not in Git)
- [ ] Database backup strategy implemented
- [ ] HTTPS enabled on API gateway
- [ ] Rate limiting configured on nginx
- [ ] Log aggregation setup (ELK, CloudWatch, etc.)
- [ ] Monitoring alerts configured (Prometheus, DataDog, etc.)
- [ ] RabbitMQ cluster for high availability
- [ ] Database replication/failover configured
- [ ] Internal endpoints restricted to VPC
- [ ] CORS origins restricted to production domains
- [ ] Secrets managed via Secret Manager (AWS Secrets Manager, Azure Key Vault, etc.)

---

## 📈 Scaling

### Horizontal Scaling
```yaml
# docker-compose.yml
services:
  notification-service:
    deploy:
      replicas: 3
    # ... other config
```

### Load Balancing (Nginx upstream)
```nginx
upstream notification_backend {
  server notification-service-1:3010;
  server notification-service-2:3010;
  server notification-service-3:3010;
}

location ~ ^/api/notifications {
  proxy_pass http://notification_backend;
}
```

### RabbitMQ Clustering
- Deploy RabbitMQ cluster (3 nodes minimum)
- Update RABBITMQ_URL to cluster endpoint
- Configure quorum queues for durability

---

## 🎉 Deployment Complete!

Service is now running and ready to send notifications! 🔥

**Next Steps:**
1. Test with real mobile app FCM tokens
2. Trigger events from other services
3. Monitor notification delivery rates
4. Setup alerts for failed notifications
5. Configure email (SMTP) and SMS (Twilio) channels
