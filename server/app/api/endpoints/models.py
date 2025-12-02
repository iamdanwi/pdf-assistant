from fastapi import APIRouter, HTTPException
import httpx
from app.core.config import settings

router = APIRouter()

@router.get("/models")
async def list_models():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            response.raise_for_status()
            data = response.json()
            
            # Extract model names and filter out embedding models
            models = [
                model["name"] for model in data.get("models", [])
                if "embed" not in model["name"] and "nomic" not in model["name"]
            ]
            return {"models": models}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch models: {str(e)}")
