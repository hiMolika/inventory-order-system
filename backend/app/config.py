from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/inventory_db"
    PORT: int = 8000
    PROJECT_NAME: str = "Inventory & Order Management API"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
