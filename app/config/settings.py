# ============================================
# Đọc environment variables từ .env
# ============================================
from pydantic_settings import BaseSettings
from typing import List
from pydantic import validator


class Settings(BaseSettings):
    """
    Application settings từ environment variables
    """
    
    # Application
    APP_NAME: str = "Verification Service"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8006
    
    # Database
    DB_HOST: str = "verification-mysql"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "rootpassword"
    DB_NAME: str = "verification_db"
    
    @property
    def DATABASE_URL(self) -> str:
        """Construct database URL"""
        return (
            f"mysql+mysqlconnector://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = ["*"]
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    # Event Bus (Optional)
    EVENT_BUS_TYPE: str = "kafka"
    KAFKA_BOOTSTRAP_SERVERS: str = "kafka:29092"
    KAFKA_GROUP_ID: str = "verification-service-group"
    
    # External Services
    MRV_SERVICE_URL: str = "http://mrv-service:8003"
    REGISTRY_SERVICE_URL: str = "http://registry-service:8007"
    NOTIFICATION_SERVICE_URL: str = "http://notification-service:8010"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()