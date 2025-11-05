# User Service - Carbon Credit Market

User authentication and management service for the Carbon Credit Vehicle Market platform, built with NestJS.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication with access/refresh tokens
- 👤 **User Management** - User registration, profile management, and account operations
- 📧 **Email Verification** - SendGrid integration for email verification
- 📄 **KYC System** - Document upload and verification for user identity
- 🔒 **Internal APIs** - Secure internal endpoints for microservice communication
- 📊 **Audit Logging** - Complete user action history tracking
- 🏥 **Health Checks** - Service health monitoring endpoints

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **Authentication**: JWT (jsonwebtoken, passport-jwt)
- **Email**: SendGrid
- **Documentation**: Swagger/OpenAPI
- **Container**: Docker & Docker Compose

## Project Structure

```
src/
├── common/              # Common utilities, decorators, filters
├── database/            # Database configuration and migrations
├── modules/
│   ├── auth/            # Authentication (login, register, JWT)
│   ├── user/            # User management (profile, internal APIs)
│   └── kyc/             # KYC document management
├── shared/
│   ├── entities/        # TypeORM entities
│   ├── dtos/            # Data transfer objects
│   └── enums/           # Shared enums
└── main.ts              # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose
- MySQL 8.0 (via Docker)

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd User_Service
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start with Docker Compose** (Recommended)
   ```bash
   docker compose up -d
   ```

   This starts:
   - User Service (port 3001)
   - MySQL Database (port 3308 → 3306 inside container)
   - Adminer (database admin, port 8081)

### Environment Variables

Key configuration in `.env`:

```env
# App
NODE_ENV=production
APP_PORT=3001
APP_URL=http://localhost:3001

# Database (Docker internal)
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=user_service_db

# JWT
JWT_SECRET=your_secret_key_here
ACCESS_TOKEN_TTL=1h
REFRESH_TOKEN_TTL=7d

# SendGrid (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your@email.com
```

⚠️ **Security Note**: Never commit `.env` file with real credentials!

## API Documentation

### Swagger UI

- **Public API**: http://localhost:3001/api/docs
- **Internal API**: http://localhost:3001/api/docs-internal

### Authentication Flow

#### 1. Register New User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phoneNumber": "0123456789",
  "userType": "BUYER"  # or "EV_OWNER", "CVA"
}
```

**Response:**
```json
{
  "message": "Registration successful. Please check your email to verify."
}
```

#### 2. Verify Email

Click the link in the verification email, or:

```bash
GET /api/auth/verify?token=<verification_token>
```

#### 3. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

#### 4. Access Protected Endpoints

Include JWT token in Authorization header:

```bash
GET /api/users/profile
Authorization: Bearer <your_access_token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "userType": "BUYER",
  "status": "ACTIVE",
  "kycStatus": "PENDING",
  "fullName": "John Doe",
  "phone": "0123456789",
  "city": null,
  "createdAt": "2025-11-05T10:30:00.000Z"
}
```

### Key Public Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/verify` | Verify email | ❌ |
| POST | `/api/auth/forgot-password` | Request password reset | ❌ |
| POST | `/api/auth/reset-password` | Reset password | ❌ |
| GET | `/api/auth/me` | Get current user info | ✅ |
| POST | `/api/auth/refresh` | Refresh access token | ✅ |
| GET | `/api/users/profile` | Get user profile | ✅ |
| PUT | `/api/users/profile` | Update profile | ✅ |
| GET | `/api/users/:id` | Get user by ID (public info) | ✅ |
| POST | `/api/kyc/upload` | Upload KYC document | ✅ |
| GET | `/api/kyc/status` | Get KYC status | ✅ |
| GET | `/api/kyc/documents` | List my KYC documents | ✅ |

### Internal API Endpoints

Protected with `x-internal-secret` header:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/internal/auth/verify` | Verify JWT token (for Gateway) |
| GET | `/internal/users/:id` | Get user details |
| PUT | `/internal/users/:id/status` | Update user status |
| POST | `/internal/users/:id/lock` | Lock user account |
| POST | `/internal/users/:id/unlock` | Unlock user account |
| GET | `/internal/kyc/user/:userId/documents` | Get user's KYC docs (admin) |
| POST | `/internal/kyc/documents/:docId/verify` | Verify KYC document |

## JWT Guard Implementation

User Service uses JWT authentication via `JwtAuthGuard`:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@CurrentUser() user: any) {
  return this.userService.getProfile(user.id);
}
```

The guard:
1. Extracts JWT token from `Authorization: Bearer <token>` header
2. Validates token signature and expiration
3. Injects user payload into request via `@CurrentUser()` decorator

## Gateway Integration

The Nginx gateway verifies JWT tokens using the `/internal/auth/verify` endpoint:

```nginx
location /api/users {
  auth_request /auth-verify;  # Verify JWT before forwarding
  proxy_pass http://user_service_app:3001;
}

location = /auth-verify {
  internal;
  proxy_pass http://user_service_app:3001/internal/auth/verify;
  proxy_pass_request_body off;
  proxy_set_header Authorization $http_authorization;
}
```

## Database Schema

### Main Tables

- **users**: Core user authentication and status
- **user_profiles**: Extended user information
- **user_action_logs**: Audit log for admin actions
- **kyc_documents**: User identity verification documents

### User Types

- `EV_OWNER`: Electric vehicle owners selling carbon credits
- `BUYER`: Companies/individuals buying carbon credits
- `CVA`: Carbon Verification Authority (verifiers)

### User Statuses

- `PENDING`: Email not verified
- `ACTIVE`: Verified and active
- `SUSPENDED`: Temporarily suspended
- `DELETED`: Soft deleted

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Development

```bash
# Watch mode (hot reload)
npm run start:dev

# Debug mode
npm run start:debug
```

## Production Deployment

```bash
# Build
npm run build

# Start production
npm run start:prod
```

## Docker Commands

```bash
# Start services
docker compose up -d

# View logs
docker logs user_service_app -f

# Restart service
docker compose restart user_service_app

# Stop all
docker compose down

# Rebuild after code changes
docker build -t user-service:dev .
docker compose restart user_service_app
```

## Database Management

Access Adminer at http://localhost:8081

- **Server**: `mysql`
- **Username**: `root`
- **Password**: (from .env `DB_PASSWORD`)
- **Database**: `user_service_db`

Or use MySQL CLI:

```bash
docker exec -it user_service_mysql mysql -u root -p user_service_db
```

## Troubleshooting

### Port Already in Use

If port 3001 is occupied:

```bash
# Find process
netstat -ano | findstr :3001

# Kill process
taskkill /PID <process_id> /F
```

### Database Connection Issues

1. Check MySQL container is running:
   ```bash
   docker ps | findstr mysql
   ```

2. Check MySQL logs:
   ```bash
   docker logs user_service_mysql
   ```

3. Verify connection:
   ```bash
   docker exec -it user_service_mysql mysql -u root -p
   ```

### Email Not Sending

- Verify `SENDGRID_API_KEY` in `.env`
- Check SendGrid sender email is verified
- Review app logs for email errors

## License

This project is part of the Carbon Credit Vehicle Market platform.

## Support

For issues and questions, please contact the development team or create an issue in the repository.
