from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    API_SECRET_KEY: str = "dev_secret"
    ALLOWED_HOSTS: List[str] = ["*"]
    MODEL_PATH_TEXT: str = "./models/mistral"
    MODEL_PATH_VISION: str = "./models/vision"
    LOG_LEVEL: str = "info"
    
    # Limits
    MAX_TEXT_LENGTH: int = 4096  # 4KB
    MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5MB

    # Hardware
    DEVICE: str = "auto"  # options: "auto", "cpu", "cuda"
    
    # Hugging Face
    HF_TOKEN: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
