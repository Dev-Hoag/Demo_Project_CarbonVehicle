.PHONY: help build up down restart logs shell db test clean

help:
	@echo "Available commands:"
	@echo "  make build      - Build Docker images"
	@echo "  make up         - Start services"
	@echo "  make down       - Stop services"
	@echo "  make restart    - Restart services"
	@echo "  make logs       - View logs"
	@echo "  make shell      - Access container shell"
	@echo "  make db         - Access MySQL shell"
	@echo "  make test       - Run tests"
	@echo "  make clean      - Clean up everything"

build:
	@echo "🔨 Building Docker images..."
	docker compose build

up:
	@echo "🚀 Starting services..."
	docker compose up -d
	@echo "✅ Services started!"
	@echo "📖 Swagger: http://localhost:8006/docs"
	@echo "💊 Health: http://localhost:8006/health"

down:
	@echo "🛑 Stopping services..."
	docker compose down

restart:
	@echo "🔄 Restarting services..."
	docker compose restart

logs:
	docker compose logs -f verification-service

shell:
	@echo "🐚 Accessing container shell..."
	docker compose exec verification-service bash

db:
	@echo "🗄️  Accessing MySQL shell..."
	docker compose exec mysql mysql -uroot -prootpassword verification_db

test:
	@echo "🧪 Running tests..."
	docker compose exec verification-service pytest

clean:
	@echo "🧹 Cleaning up..."
	docker compose down -v
	docker system prune -f
	@echo "✅ Cleanup complete!"u