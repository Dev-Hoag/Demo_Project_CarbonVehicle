# Carbon Credit Marketplace - Docker Deployment Guide

## 🚀 Quick Start (One-Command Deploy)

### Start All Services
```bash
docker-compose -f docker-compose.full.yml up -d
```

### Stop All Services
```bash
docker-compose -f docker-compose.full.yml down
```

### Rebuild and Start
```bash
docker-compose -f docker-compose.full.yml up -d --build
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.full.yml logs -f

# Specific service
docker-compose -f docker-compose.full.yml logs -f notification-service
```

## 📋 Service Architecture

### Infrastructure Layer
- **RabbitMQ**: Message broker (5672, 15672 - Management UI)
- **API Gateway**: Nginx reverse proxy (80)

### NestJS Microservices (TypeScript)
| Service | Port | Database Port | Description |
|---------|------|---------------|-------------|
| User Service | 3001 | 3321 | User authentication & management |
| Admin Service | 3000 | 3322 | Admin panel & management |
| Payment Service | 3007 | 3323 | VNPay integration & payments |
| Transaction Service | 3009 | 3324 | Transaction history |
| Wallet Service | 3008 | 3325 | Digital wallet management |
| Notification Service | 3010 | 3320 | Real-time notifications (WebSocket) |

### Spring Boot Microservices (Java)
| Service | Port | Database Port | Description |
|---------|------|---------------|-------------|
| Trip Service | 8091 | 3319 | EV trip tracking & verification |
| Listing Service | 8092 | 3317 | Carbon credit marketplace listings |
| Credit Service | 8093 | 3318 | Carbon credit management |

## 🔧 Configuration

### Environment Variables
All services use environment variables defined in `docker-compose.full.yml`:
- Database credentials
- RabbitMQ connection strings
- JWT secrets
- Service URLs

### Volumes
All databases use named volumes for data persistence:
- `ccm_rabbitmq_data`
- `ccm_user_mysql_data`
- `ccm_admin_mysql_data`
- `ccm_payment_mysql_data`
- `ccm_transaction_mysql_data`
- `ccm_wallet_mysql_data`
- `ccm_notification_mysql_data`
- `ccm_trip_mysql_data`
- `ccm_listing_mysql_data`
- `ccm_credit_mysql_data`

## 🧪 Health Checks

### Check Service Status
```bash
docker-compose -f docker-compose.full.yml ps
```

### Check Specific Service Health
```bash
docker inspect notification_service_app --format='{{.State.Health.Status}}'
```

### Access RabbitMQ Management
```
http://localhost:15672
Username: ccm_admin
Password: ccm_password_2024
```

## 🐛 Troubleshooting

### Service Won't Start
```bash
# Check logs
docker-compose -f docker-compose.full.yml logs <service-name>

# Restart specific service
docker-compose -f docker-compose.full.yml restart <service-name>

# Rebuild specific service
docker-compose -f docker-compose.full.yml up -d --build <service-name>
```

### Database Connection Issues
```bash
# Check database health
docker-compose -f docker-compose.full.yml ps | grep mysql

# Reset database (WARNING: Deletes all data)
docker-compose -f docker-compose.full.yml down -v
docker-compose -f docker-compose.full.yml up -d
```

### Network Issues
```bash
# Recreate network
docker network rm ccm_net
docker network create ccm_net
docker-compose -f docker-compose.full.yml up -d
```

## 🔄 Development Workflow

### Update Single Service
```bash
# Stop service
docker-compose -f docker-compose.full.yml stop notification-service

# Rebuild
docker-compose -f docker-compose.full.yml build notification-service

# Start
docker-compose -f docker-compose.full.yml up -d notification-service
```

### Clean Everything (Fresh Start)
```bash
# Stop and remove all containers, networks, volumes
docker-compose -f docker-compose.full.yml down -v

# Start fresh
docker-compose -f docker-compose.full.yml up -d --build
```

## 📊 Service Dependencies

```
Gateway
  ├── User Service → user-mysql
  ├── Admin Service → admin-mysql  
  ├── Payment Service → payment-mysql, rabbitmq
  ├── Transaction Service → transaction-mysql
  ├── Wallet Service → wallet-mysql, rabbitmq
  ├── Notification Service → notification-mysql, rabbitmq
  ├── Trip Service → trip-mysql, rabbitmq
  ├── Listing Service → listing-mysql, trip-service, credit-service, rabbitmq
  └── Credit Service → credit-mysql, rabbitmq
```

## 🎯 Testing Event Flow

### Test Credit Issued Event
```bash
# Run test script
./test-credit-event.ps1
```

### Monitor RabbitMQ Queues
```
Open: http://localhost:15672/#/queues/ccm_vhost
```

### Test Notification WebSocket
```javascript
// In browser console (frontend running)
// Should see: "Connected to notification WebSocket"
```

## 📝 Notes

- All services are connected to `ccm_net` network
- Gateway depends on all backend services
- RabbitMQ is used for event-driven communication
- WebSocket available at `ws://localhost:3010/notifications`
- API Gateway routes all requests through `http://localhost/api/*`

## ⚠️ Important

- Make sure ports 80, 3000-3010, 3317-3325, 5672, 8091-8093, 15672 are available
- First startup may take 5-10 minutes (building all images)
- Database initialization happens on first startup
- Check `docker-compose -f docker-compose.full.yml logs` if services fail to start
