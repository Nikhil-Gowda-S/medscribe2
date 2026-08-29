from pydantic_settings import BaseSettings
from typing import List, Union

class Settings(BaseSettings):
    PROJECT_NAME: str = "MedScribe API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "postgresql+psycopg://postgres:password@localhost:5432/medscribe"

    JWT_SECRET: str = "dev_secret_jwt_key_medscribe_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    GROQ_API_KEY: str = "dummy_key"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://localhost:3000"]
    HOSPITAL_NAME: str = "Medical Center"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

if settings.ENVIRONMENT.lower() == "production" and settings.JWT_SECRET == "dev_secret_jwt_key_medscribe_2026":
    raise RuntimeError("JWT_SECRET must be set to a secure value in production")
