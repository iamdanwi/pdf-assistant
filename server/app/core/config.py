import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocuMind API"
    API_V1_STR: str = "/api"
    
    # Vector DB
    CHROMA_PERSIST_DIRECTORY: str = "./chroma_db"
    
    # LLM & Embeddings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    EMBEDDING_MODEL: str = "nomic-embed-text"
    CHAT_MODEL: str = "qwen3:0.6b"

    class Config:
        env_file = ".env"

settings = Settings()
