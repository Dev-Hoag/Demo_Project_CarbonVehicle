# Carbon Credit Marketplace

A comprehensive microservices-based platform for managing carbon credits earned from electric vehicle (EV) trips.

## 🚀 Quick Start

### Start All Services (Recommended)
```powershell
# Start all microservices with one command
.\start-all.ps1

# Or manually
docker-compose -f docker-compose.full.yml up -d
```

### Check Service Status
```powershell
.\status.ps1
```

### Stop All Services
```powershell
.\stop-all.ps1
```

### Restart All Services
```powershell
# Normal restart
.\restart-all.ps1

# Rebuild and restart
.\restart-all.ps1 -Build
```

## 📋 Architecture

### Infrastructure
- **API Gateway**: Nginx reverse proxy (Port 80)
- **RabbitMQ**: Message broker for event-driven communication (5672, 15672)

### Microservices

#### NestJS Services (TypeScript)
| Service | Port | Description |
|---------|------|-------------|
| User Service | 3001 | Authentication & user management |
| Admin Service | 3000 | Admin panel & management |
| Payment Service | 3007 | VNPay payment integration |
| Transaction Service | 3009 | Transaction history |
| Wallet Service | 3008 | Digital wallet management |
| Notification Service | 3010 | Real-time notifications (WebSocket) |

#### Spring Boot Services (Java)
| Service | Port | Description |
|---------|------|-------------|
| Trip Service | 8091 | EV trip tracking & verification |
| Listing Service | 8092 | Carbon credit marketplace |
| Credit Service | 8093 | Carbon credit management |

### Frontend
- **React + Vite**: Modern web interface (Port 5173)
- **WebSocket**: Real-time notifications

## 🔧 Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend)
- Java 21+ (for Spring Boot services, optional)

### Environment Configuration
1. Copy `.env.example` to `.env`
2. Update credentials and API keys
3. Configure VNPay credentials (if using payment)

### Start Development Environment
```powershell
# Start all backend services
.\start-all.ps1

# In another terminal, start frontend
cd CCM-Frontend
npm install
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost
- **RabbitMQ Management**: http://localhost:15672 (ccm_admin / ccm_password_2024)

## 📚 Documentation

- [Docker Deployment Guide](DOCKER_DEPLOYMENT.md)
- [RabbitMQ Integration Status](RABBITMQ_INTEGRATION_STATUS.md)
- [Setup Guide](SETUP_GUIDE.md)

## 🧪 Testing

### Test Event Flow
```powershell
# Test credit issued event
.\test-credit-event.ps1
```

### Monitor Services
```powershell
# View all logs
docker-compose -f docker-compose.full.yml logs -f

# View specific service
docker-compose -f docker-compose.full.yml logs -f notification-service
```

## 🏗️ Project Structure

```
CreditCarbonMarket/
├── Admin_Service/          # NestJS - Admin management
├── CCM-Frontend/           # React + Vite frontend
├── credit-service/         # Spring Boot - Credit management
├── gateway/                # Nginx API Gateway
├── listing-service/        # Spring Boot - Marketplace
├── Notification_Service/   # NestJS - Notifications (WebSocket)
├── Payment_Service/        # NestJS - VNPay integration
├── Transaction_Service/    # NestJS - Transaction history
├── trip-service/           # Spring Boot - Trip tracking
├── User_Service/           # NestJS - User management
├── Wallet_Service/         # NestJS - Wallet management
├── rabbitmq/               # RabbitMQ configuration
├── docker-compose.full.yml # Main compose file (all services)
└── start-all.ps1           # Startup script
```

## 🔄 Event-Driven Architecture

Services communicate via RabbitMQ events:
- `trip.verified` - Trip verified and CO2 calculated
- `credit.issued` - Carbon credits issued to user
- `listing.created` - New marketplace listing created
- `listing.sold` - Listing successfully sold
- `payment.completed` - Payment processed
- `withdrawal.approved` - Withdrawal request approved
- `withdrawal.rejected` - Withdrawal request rejected

## 🛠️ Troubleshooting

### Services won't start
```powershell
# Check logs
docker-compose -f docker-compose.full.yml logs <service-name>

# Rebuild specific service
docker-compose -f docker-compose.full.yml up -d --build <service-name>
```

### Database issues
```powershell
# Check database health
.\status.ps1

# Reset database (WARNING: Deletes all data)
docker-compose -f docker-compose.full.yml down -v
.\start-all.ps1
```

### Port conflicts
Make sure these ports are available:
- 80 (Gateway)
- 3000-3010 (NestJS services)
- 3317-3325 (MySQL databases)
- 5672, 15672 (RabbitMQ)
- 5173 (Frontend)
- 8091-8093 (Spring Boot services)

## 📝 Notes

- First startup may take 5-10 minutes (building all images)
- All data persists in Docker volumes
- RabbitMQ queues are auto-created on first event
- WebSocket notifications available at `ws://localhost:3010/notifications`

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test locally with `.\start-all.ps1`
4. Submit pull request

## 📄 License

Private project - All rights reserved
