from fastapi import APIRouter
from app.models.loader import model_loader

router = APIRouter()

@router.get("/live")
async def liveness_probe():
    """
    Checks if the container/process is running.
    """
    return {"status": "alive"}

@router.get("/ready")
async def readiness_probe():
    """
    Checks if the core text models are loaded and server is ready to accept traffic.
    """
    if model_loader.text_model_ready:
        return {"status": "ready"}
    return {"status": "loading"}, 503
