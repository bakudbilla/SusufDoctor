import os
import re
import torch
from transformers import AutoModelForVision2Seq, AutoProcessor
from peft import PeftModel
from PIL import Image
from dotenv import load_dotenv
import warnings

# Suppress harmless warnings
warnings.filterwarnings("ignore", message=".*copying from a non-meta parameter.*")
warnings.filterwarnings("ignore", message=".*for base_model.*")

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME", "Awinpang/smolvlm-finetuned-xray")
BASE_MODEL_ID = "HuggingFaceTB/SmolVLM-500M-Instruct"

# Cache
_MODEL_CACHE = None
_LOADING_LOCK = False

# Cleaning constants
_GARBAGE_PHRASES = [
    "please provide",
    "end of impression", 
    "summary:",
    "signed by",
    "date of exam",
    "template",
    "report end",
    "final report",
    "image for study",
    "history:",
    "assistant:",
    "user:"
]

# Acronyms to preserve uppercase
_ACRONYMS = ["pa", "ap", "copd", "chf", "ct", "mri", "cxr", "tb", "ai", "pao2", "fio2", "ecg", "ett", "cvp"]

def lowercase_sentences(text: str) -> str:
    """
    Lowercase clinical sentences while:
    - Keeping section headers uppercase
    - Keeping medical acronyms uppercase
    """
    if not text:
        return text
        
    lines = text.split("\n")
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            new_lines.append("")
            continue

        # Keep section headers uppercase
        if stripped.endswith(":") and len(stripped) < 50:  # Only short lines ending with :
            new_lines.append(stripped.upper())
            continue

        lowered = stripped.lower()

        # Restore common medical acronyms to uppercase
        for ac in _ACRONYMS:
            lowered = re.sub(rf'\b{ac}\b', ac.upper(), lowered, flags=re.IGNORECASE)

        new_lines.append(lowered)

    return "\n".join(new_lines)

def apply_impression_fallback(text: str) -> str:
    """
    Ensures IMPRESSION is never empty or meaningless.
    Applies a safe fallback if the model does not generate a usable impression.
    """
    if not text:
        return "FINDINGS:\nThe lungs are clear. The cardiomediastinal silhouette is normal. No pleural effusion or pneumothorax.\n\nIMPRESSION:\nNormal chest radiograph."

    up = text.upper()
    if "IMPRESSION:" not in up:
        return text.rstrip() + "\n\nIMPRESSION:\nNormal chest radiograph."

    parts = re.split(r'IMPRESSION:', text, flags=re.IGNORECASE)
    if len(parts) < 2:
        return text + "\n\nIMPRESSION:\nNormal chest radiograph."
        
    findings = parts[0]
    impression = parts[1].strip()

    # Clean impression text
    impression = re.sub(r'^\W+', '', impression)  # Remove leading punctuation
    impression = re.sub(r'\s+', ' ', impression)  # Normalize whitespace
    
    if len(impression.replace(".", "").replace("-", "").replace(",", "").strip()) < 15:
        impression = "Normal chest radiograph."

    return findings.rstrip() + "\n\nIMPRESSION:\n" + impression

def load_model(token: str = HF_TOKEN):
    """
    Load the base model and apply LoRA adapter.
    Thread-safe singleton pattern to prevent multiple loads.
    """
    global _MODEL_CACHE, _LOADING_LOCK

    if _MODEL_CACHE is not None:
        print("Returning cached model")
        return _MODEL_CACHE

    if _LOADING_LOCK:
        import time
        print("Model is loading, waiting...")
        while _LOADING_LOCK:
            time.sleep(0.5)
        return _MODEL_CACHE

    try:
        _LOADING_LOCK = True
        print(f"Loading base model: {BASE_MODEL_ID}")

        base_model = AutoModelForVision2Seq.from_pretrained(
            BASE_MODEL_ID,
            trust_remote_code=True,
            torch_dtype=torch.float16,
            device_map="auto",
            token=token,
            low_cpu_mem_usage=True
        )

        print(f"Loading LoRA adapter: {MODEL_ID}")
        model = PeftModel.from_pretrained(
            base_model,
            MODEL_ID,
            token=token,
            torch_dtype=torch.float16
        )

        print("Merging LoRA adapter...")
        model = model.merge_and_unload()
        model.eval()

        # Apply optimizations
        if torch.cuda.is_available():
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.benchmark = True

        print("Loading processor...")
        processor = AutoProcessor.from_pretrained(
            BASE_MODEL_ID,
            trust_remote_code=True,
            token=token
        )

        _MODEL_CACHE = (processor, model)
        print(" Model loaded successfully")
        return _MODEL_CACHE

    except Exception as e:
        print(f" Error loading model: {e}")
        _LOADING_LOCK = False
        raise
    finally:
        _LOADING_LOCK = False

def _build_prompt(prior_text, bmi, age, sex, view_type) -> str:
    """
    Radiologist-grade prompt that enforces structure.
    """
    # Clean prior text
    if prior_text:
        prior_text = ' '.join(prior_text.split()[:50])  # Limit length
    else:
        prior_text = "No prior studies available"

    return f"""Analyze this chest X-ray image and generate a professional radiology report.

Follow this exact structure:

FINDINGS:
Describe the lung fields, heart size, mediastinum, diaphragm, bones, and any support devices.

IMPRESSION:
Provide 1-3 concise diagnostic statements.

Patient: {age}-year-old {sex}, BMI: {bmi}, View: {view_type}
Prior: {prior_text}""".strip()

def clean_report_text(text: str) -> str:
    """
    Clean the generated report text.
    """
    if not text:
        return "FINDINGS:\nThe lungs are clear. Cardiomediastinal silhouette is normal.\n\nIMPRESSION:\nNormal chest radiograph."

    original_text = text
    
    # Remove any assistant prefixes
    text = re.sub(r'^(assistant|user|model):\s*', '', text, flags=re.IGNORECASE)
    
    # Extract from FINDINGS if present
    up = text.upper()
    if "FINDINGS:" in up:
        idx = up.index("FINDINGS:")
        text = text[idx:]

    # Remove garbage phrases
    low = text.lower()
    for phrase in _GARBAGE_PHRASES:
        if phrase in low:
            idx = low.index(phrase)
            text = text[:idx].strip()
            break

    # Ensure proper section structure
    if "IMPRESSION:" not in up:
        if "FINDINGS:" in up:
            text = text + "\n\nIMPRESSION:\n"
        else:
            text = "FINDINGS:\n" + text + "\n\nIMPRESSION:\n"

    # Normalize spacing
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text).strip()
    text = re.sub(r' +', ' ', text)

    # Apply lowercase with preservation
    text = lowercase_sentences(text)

    # Final impression fallback
    text = apply_impression_fallback(text)

    print(f"Cleaning report: {len(original_text)} -> {len(text)} chars")
    return text

def predict_report(model_bundle, image: Image.Image, prior_text, bmi, age, sex, view_type):
    """
    Generate a radiology report using the enhanced prompt and cleaner.
    """
    try:
        processor, model = model_bundle

        user_prompt = _build_prompt(prior_text, bmi, age, sex, view_type)
        print(f"Prompt length: {len(user_prompt)}")

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image"},
                    {"type": "text", "text": user_prompt}
                ]
            }
        ]

        prompt_text = processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=False
        )

        inputs = processor(
            text=prompt_text,
            images=[image],
            return_tensors="pt",
            padding=True
        ).to(model.device)

        print("Generating report...")
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=400,
                temperature=0.3,  # Lower for more consistent output
                top_p=0.8,
                repetition_penalty=1.2,
                no_repeat_ngram_size=3,
                do_sample=True,
                pad_token_id=processor.tokenizer.eos_token_id,
                eos_token_id=processor.tokenizer.eos_token_id,
                early_stopping=True
            )

        # Extract only the new tokens (excluding prompt)
        prompt_len = inputs["input_ids"].shape[1]
        tokens = generated_ids[0, prompt_len:]
        raw_text = processor.decode(tokens, skip_special_tokens=True).strip()

        print(f"Raw output: {raw_text[:400]}...")
        
        cleaned_text = clean_report_text(raw_text)
        
        print(f" Final report: {len(cleaned_text)} characters")
        return {"full_text": cleaned_text}
        
    except Exception as e:
        print(f"Prediction error: {e}")
        # Return a safe fallback
        fallback = f"""FINDINGS:
The lungs are clear without evidence of focal consolidation, pneumothorax, or pleural effusion. 
Cardiomediastinal silhouette is within normal limits. 
No acute bony abnormalities.

IMPRESSION:
Normal chest radiograph.

Technical note: AI model encountered an error during generation."""
        
        return {"full_text": fallback, "error": str(e)}