from pydantic import BaseSettings

class Settings(BaseSettings):
    DB_USER: str = "root"
    DB_PASSWORD: str = "example"
    DB_HOST: str = "db"
    DB_PORT: int = 3306
    DB_NAME: str = "verification_db"
    JWT_SECRET: str = "supersecret"
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
