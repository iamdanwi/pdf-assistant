from fastapi import APIRouter
from app.services.vector_store import vector_store

router = APIRouter()

@router.delete("/clear")
async def clear_database():
    vector_store.clear()
    return {"message": "Vector database cleared"}
