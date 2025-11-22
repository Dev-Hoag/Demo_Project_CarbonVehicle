# Verification (CVA) Service

Carbon Verification & Audit Service for Carbon Credit Marketplace

## Features

- 🔍 Verify CO2 reduction claims from EV trips
- ✅ Approve/Reject verifications (CVA only)
- 🔐 Digital signature for approved credits
- 📊 Statistics and reporting
- 🎯 RESTful API với Swagger UI

## Tech Stack

- **Framework**: FastAPI (Python 3.11)
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic 2.5
- **Deployment**: Docker + Docker Compose

## Quick Start

### Prerequisites

- Docker Desktop
- Visual Studio Code (optional)

### Run with Docker

```bash
# Clone repository
git clone <repo-url>
cd verification-service

# Start services
docker compose up -d

# View logs
docker compose logs -f

# Access Swagger UI
open http://localhost:8006/docs
```

### Run Locally (without Docker)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Setup MySQL database
# Create database: verification_db

# Run application
uvicorn app.main:app --reload --port 8006
```

## API Endpoints

- `POST /api/v1/verifications` - Create verification
- `GET /api/v1/verifications` - List verifications
- `GET /api/v1/verifications/{id}` - Get verification detail
- `POST /api/v1/verifications/{id}/approve` - Approve (CVA)
- `POST /api/v1/verifications/{id}/reject` - Reject (CVA)
- `GET /api/v1/verifications/stats/summary` - Statistics

## Documentation

- Swagger UI: http://localhost:8006/docs
- ReDoc: http://localhost:8006/redoc

## Project Structure

```
verification-service/
├── app/
│   ├── main.py              # Entry point
│   ├── config/              # Configuration
│   ├── models/              # Database models
│   ├── schemas/             # Pydantic schemas
│   ├── api/                 # API endpoints
│   ├── services/            # Business logic
│   ├── repositories/        # Data access
│   └── utils/               # Utilities
├── init-scripts/            # Database init
├── Dockerfile
├── docker-compose.yml
└── requirements.txt
```

## License

MIT