import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Certificate Service"
    APP_VERSION: str = "1.0.0"
    APP_PORT: int = 3009
    DEBUG: bool = False
    
    # Database
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "rootpassword"
    DB_NAME: str = "certificate_service_db"
    
    # RabbitMQ
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "rabbitmq")
    RABBITMQ_PORT: int = int(os.getenv("RABBITMQ_PORT", 5672))
    RABBITMQ_USER: str = os.getenv("RABBITMQ_USER", "guest")
    RABBITMQ_PASS: str = os.getenv("RABBITMQ_PASS", "guest")
    # Accept either RABBITMQ_PASS or RABBITMQ_PASSWORD in env files
    RABBITMQ_PASSWORD: Optional[str] = None
    RABBITMQ_EXCHANGE: str = os.getenv("RABBITMQ_EXCHANGE", "carbon_exchange")
    RABBITMQ_QUEUE: str = os.getenv("RABBITMQ_QUEUE", "certificate_service_queue")


    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    TEMPLATE_DIR: str = "./templates"
    MAX_FILE_SIZE: int = 10485760  # 10MB
    
    # External Services
    VERIFICATION_SERVICE_URL: str = "http://localhost:3008"
    USER_SERVICE_URL: str = "http://localhost:3001"
    NOTIFICATION_SERVICE_URL: str = "http://localhost:3006"
    
    # PDF Generation
    PDF_AUTHOR: str = "Carbon Credit Platform"
    PDF_SUBJECT: str = "Carbon Credit Certificate"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()