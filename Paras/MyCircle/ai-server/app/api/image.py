from fastapi import APIRouter, Depends, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from app.utils.security import validate_api_key, validate_image_file
from app.models.loader import model_loader

router = APIRouter(dependencies=[Depends(validate_api_key)])

class ImageAnalyzeResponse(BaseModel):
    labels: List[str]
    nsfw_score: float
    risk: str
    summary: str

@router.post("/analyze", response_model=ImageAnalyzeResponse)
async def analyze_image(
    file: UploadFile = File(..., description="Image file to analyze"),
    caption: Optional[str] = Form(None),
    _valid_file: UploadFile = Depends(validate_image_file)
):
    """
    Analyzes an uploaded image using the Vision model.
    """
    from PIL import Image
    import io

    # 1. Load Model
    model, tokenizer = model_loader.get_vision_model_instance()
    
    # 2. Read Image
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    
    # 3. Inference with Moondream
    # Moondream2 specialized inference
    try:
        enc_image = model.encode_image(image)
        
        # Description
        desc_answer = model.answer_question(enc_image, "Describe this image briefly.", tokenizer)
        
        # NSFW Risk
        risk_answer = model.answer_question(enc_image, "Is this image NSFW or unsafe? Answer yes or no.", tokenizer)
        risk_score = 0.9 if "yes" in risk_answer.lower() else 0.05
        
        # Labels
        labels_answer = model.answer_question(enc_image, "List 3 main objects in this image, comma separated.", tokenizer)
        labels = [l.strip() for l in labels_answer.split(",")]
        
        return {
            "labels": labels,
            "nsfw_score": risk_score, 
            "risk": "high" if risk_score > 0.5 else "low",
            "summary": desc_answer
        }

    except Exception as e:
        return {
            "labels": [],
            "nsfw_score": 0.0, 
            "risk": "error",
            "summary": f"Could not analyze image: {str(e)}"
        }
