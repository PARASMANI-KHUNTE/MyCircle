from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List
from app.utils.security import validate_api_key, validate_text_length
from app.models.loader import model_loader

router = APIRouter(dependencies=[Depends(validate_api_key)])

# Data Models
class TextAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1)
    context: str = Field("post", pattern="^(post|chat|comment)$")
    language: str = "en"

class TextAnalyzeResponse(BaseModel):
    sentiment: str
    toxicity_score: float
    flags: List[str] = []
    confidence: float

class TextSummarizeRequest(BaseModel):
    text: str
    max_length: int = 100

class TextModerateRequest(BaseModel):
    text: str
    strict: bool = True

class TextModerateResponse(BaseModel):
    allowed: bool
    reason: Optional[str] = None
    suggested_alternative: Optional[str] = None


# --- Helper for Stage 1 Detection ---
def stage1_abuse_check(text: str) -> bool:
    """
    Fast rule-based check. Returns True if abuse detected.
    """
    bad_words = ["badword1", "badword2"] # TODO: Load from robust wordlist
    text_lower = text.lower()
    for word in bad_words:
        if word in text_lower:
            return True
    return False


@router.post("/analyze", response_model=TextAnalyzeResponse)
async def analyze_text(request: TextAnalyzeRequest, text: str = Depends(validate_text_length)):
    """
    Analyzes text for sentiment and toxicity using TinyLlama.
    """
    # 1. Fast Rule-Based Check (Stage 1)
    if stage1_abuse_check(request.text):
         return {
            "sentiment": "negative",
            "toxicity_score": 1.0,
            "flags": ["bad_keywords"],
            "confidence": 1.0
         }

    # 2. LLM Inference (Stage 2)
    model, tokenizer = model_loader.get_text_model_instance()
    
    # TinyLlama Chat Template
    prompt = f"""<|system|>
You are a sentiment analysis AI. Analyze the text.
Output a JSON object with keys: sentiment (positive/neutral/negative), toxicity_score (0.0 to 1.0), flags (list of strings).
</s>
<|user|>
Text: "{request.text}"
</s>
<|assistant|>"""
    
    try:
        inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
        
        outputs = model.generate(
            **inputs, 
            max_new_tokens=150, 
            do_sample=False, 
            pad_token_id=tokenizer.eos_token_id
        )
        
        result_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        # Log RAW output for debugging
        print(f"DEBUG RAW OUTPUT: {result_text}")
        
        # Robust Regex JSON Extraction
        import re
        import json
        
        match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                data = json.loads(json_str)
                # Ensure defaults
                data.setdefault("flags", [])
                data.setdefault("confidence", 0.8)
                return TextAnalyzeResponse(**data)
            except Exception as e:
                print(f"JSON Parse Error: {e}")
        
        # Fallback if no JSON found
        print("Fallback triggered: No JSON found in output.")
        return {"sentiment": "neutral", "toxicity_score": 0.0, "flags": ["parse_error"], "confidence": 0.0}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize")
async def summarize_text(request: TextSummarizeRequest, text: str = Depends(validate_text_length)):
    model, tokenizer = model_loader.get_text_model_instance()
    
    prompt = f"[INST] Summarize the following text in under {request.max_length} words:\n{request.text} [/INST]"
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    outputs = model.generate(
        **inputs, 
        max_new_tokens=request.max_length * 2,
        do_sample=True,
        temperature=0.7,
        pad_token_id=tokenizer.eos_token_id
    )
    
    # Simple extraction (removing prompt)
    full_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Ideally stripe prompt logic
    response_text = full_text.split("[/INST]")[-1].strip()
    
    return {"summary": response_text}

@router.post("/moderate", response_model=TextModerateResponse)
async def moderate_text(request: TextModerateRequest, text: str = Depends(validate_text_length)):
    """
    Two-stage moderate pipeline.
    """
    if stage1_abuse_check(request.text):
         return {
            "allowed": False,
            "reason": "bad_keywords_detected",
            "suggested_alternative": "***"
         }
    
    # Stage 2 LLM
    model, tokenizer = model_loader.get_text_model_instance()
    prompt = f"""[INST] You are a content moderator. Validating chat message.
    Output JSON only: {{ "allowed": true/false, "reason": "...", "suggested_alternative": "..." }}
    Message: "{request.text}" [/INST]"""
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    outputs = model.generate(**inputs, max_new_tokens=64, pad_token_id=tokenizer.eos_token_id)
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Parse JSON logic similar to analyze...
    
    return {
        "allowed": True,
        "reason": None,
        "suggested_alternative": None
    }
