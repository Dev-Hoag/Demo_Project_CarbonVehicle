# ============================================
# Đọc environment variables từ .env
# ============================================
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    PORT: int = 8006
    DEBUG: bool = True
    
    # Database
    DB_HOST: str = "mysql"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "rootpassword"
    DB_NAME: str = "verification_db"
    
    # JWT
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    
    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+mysqlconnector://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    class Config:
        env_file = ".env"

settings = Settings()