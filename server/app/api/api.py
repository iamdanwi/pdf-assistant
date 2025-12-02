from fastapi import APIRouter
from app.api.endpoints import ingest, chat, utils, audio, models
from fastapi.staticfiles import StaticFiles

api_router = APIRouter()
api_router.include_router(ingest.router, tags=["ingest"])
api_router.include_router(chat.router, tags=["chat"])
api_router.include_router(utils.router, tags=["utils"])
api_router.include_router(audio.router, tags=["audio"])
api_router.include_router(models.router, tags=["models"])
