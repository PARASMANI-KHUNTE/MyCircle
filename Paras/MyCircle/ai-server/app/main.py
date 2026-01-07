from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
import time
import logging
from app.config import settings
from app.models.loader import model_loader
from app.api import health, text, image

# Setup logging
logging.basicConfig(level=settings.LOG_LEVEL.upper())
logger = logging.getLogger("uvicorn")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load text models
    logger.info("Server starting up...")
    model_loader.load_text_model()
    yield
    # Shutdown
    logger.info("Server shutting down...")

app = FastAPI(
    title="AI Inference Server",
    description="Microservice for Text and Image Analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware for observability (request duration)
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    logger.info(f"Path: {request.url.path} | Duration: {process_time:.4f}s")
    return response

# Include Routers
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(text.router, prefix="/text", tags=["Text Analysis"])
app.include_router(image.router, prefix="/image", tags=["Image Analysis"])

@app.get("/")
async def root():
    return {"message": "AI Inference Server is running", "docs": "/docs"}
