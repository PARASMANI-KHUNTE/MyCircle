import time
import logging
import torch
from threading import Lock
from app.config import settings
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    AutoProcessor, 
    AutoModelForVision2Seq,
    BitsAndBytesConfig
)

logger = logging.getLogger("uvicorn")

class ModelLoader:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelLoader, cls).__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
            
        self.text_model = None
        self.text_tokenizer = None
        
        self.vision_model = None
        self.vision_tokenizer = None
        
        self.text_model_ready = False
        self.vision_model_ready = False
        self.device = self._get_device()
        self._initialized = True
        logger.info(f"ModelLoader initialized on device: {self.device}")

    def _get_device(self) -> str:
        requested = settings.DEVICE.lower()
        if requested == "cuda":
            return "cuda" if torch.cuda.is_available() else "cpu"
        if requested == "cpu":
            return "cpu"
        return "cuda" if torch.cuda.is_available() else "cpu"

    def _get_quantization_config(self):
        # Only quantize if on CUDA
        if self.device == "cuda":
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4"
            )
        return None

    def load_text_model(self):
        if self.text_model_ready:
            return

        # model_id = "mistralai/Mistral-7B-Instruct-v0.2"
        model_id = "TinyLlama/TinyLlama-1.1B-Chat-v1.0" # Switched to smaller model for 16GB RAM system compatibility
        
        logger.info(f"Loading Text Model: {model_id} on {self.device}...")
        
        try:
            bnb_config = self._get_quantization_config()
            
            self.text_tokenizer = AutoTokenizer.from_pretrained(model_id)
            
            # Map to device automatically handled by accelerate/bitsandbytes if device_map="auto"
            # If CPU, device_map="auto" might be slow, usually explicit placement is better, 
            # but transformers handles it well now.
            device_map = "auto" if self.device == "cuda" else "cpu"
            
            self.text_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                quantization_config=bnb_config if self.device == "cuda" else None,
                device_map=device_map,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                trust_remote_code=True
            )
            
            self.text_model_ready = True
            logger.info("Text model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load text model: {e}")
            raise e

    def load_vision_model_lazy(self):
        if self.vision_model_ready:
            return

        with self._lock:
            if not self.vision_model_ready:
                # Using Moondream2 (Small, <2GB RAM)
                model_id = "vikhyatk/moondream2"
                revision = "2024-03-06" # Pinned revision for stability
                logger.info(f"Loading Vision Model: {model_id} on {self.device}...")
                
                try:
                    # Moondream uses standard AutoModelForCausalLM actually, but let's check config
                    # It runs best with its own code.
                    
                    self.vision_model = AutoModelForCausalLM.from_pretrained(
                        model_id, 
                        trust_remote_code=True, 
                        revision=revision,
                        torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                        device_map={"": self.device} # Explicit device map for moondream
                    )
                    self.vision_tokenizer = AutoTokenizer.from_pretrained(model_id, revision=revision)
                    
                    self.vision_model_ready = True
                    logger.info("Vision model loaded successfully.")
                except Exception as e:
                    logger.error(f"Failed to load vision model: {e}")
                    raise e

    def get_text_model_instance(self):
        if not self.text_model_ready:
            self.load_text_model()
        return self.text_model, self.text_tokenizer

    def get_vision_model_instance(self):
        self.load_vision_model_lazy()
        return self.vision_model, self.vision_tokenizer

# Global singleton instance
model_loader = ModelLoader()
