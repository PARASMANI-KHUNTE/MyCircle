from fastapi import HTTPException, Security, Header, UploadFile
from fastapi.security.api_key import APIKeyHeader
from app.config import settings
import logging

logger = logging.getLogger("uvicorn")

API_KEY_NAME = "X-Internal-Secret"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def validate_api_key(api_key: str = Security(api_key_header)):
    """
    Validates the internal API key from the request header.
    This ensures only authorized services (like the Express API) can access this server.
    """
    if api_key != settings.API_SECRET_KEY:
        logger.warning(f"Unauthorized access attempt with key: {api_key}")
        raise HTTPException(
            status_code=403,
            detail="Could not validate credentials"
        )
    return api_key

async def validate_text_length(text: str):
    """
    Validates the length of the input text.
    """
    if len(text) > settings.MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text too long. Max allowed is {settings.MAX_TEXT_LENGTH} characters."
        )
    return text

async def validate_image_file(file: UploadFile):
    """
    Validates image file size and MIME type.
    """
    # Check MIME type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Invalid image type. Allowed: jpeg, png, webp.")
    
    # Check size (Note: This reads the file, better to check Content-Length header first if reliable, 
    # but reading into chunks is safer for exact size)
    # For simplicity, we check raw size after read or use spooled file. 
    # FastAPI SpooledTemporaryFile doesn't always have convenient size attr without rolling to end.
    # We will rely on reading content in the handler, but we can check Content-Length header here as a fast fail.
    
    content_length = file.headers.get("content-length")
    if content_length:
        if int(content_length) > settings.MAX_IMAGE_SIZE_BYTES:
             raise HTTPException(status_code=413, detail=f"Image too large. Max allowed is {settings.MAX_IMAGE_SIZE_BYTES} bytes.")
    
    return file
