import os
import re
import torch
from transformers import AutoModelForVision2Seq, AutoProcessor
from peft import PeftModel
from PIL import Image
from dotenv import load_dotenv

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
    "history:"
]

# Acronyms to preserve uppercase
_ACRONYMS = ["pa", "ap", "copd", "chf", "ct", "mri", "cxr", "tb", "ai", "pao2", "fio2"]


def lowercase_sentences(text: str) -> str:
    """
    Lowercase clinical sentences while:
    - Keeping section headers uppercase
    - Keeping medical acronyms uppercase
    """
    lines = text.split("\n")
    new_lines = []

    for line in lines:
        stripped = line.strip()

        # Keep section headers uppercase
        if stripped.endswith(":"):
            new_lines.append(stripped.upper())
            continue

        lowered = stripped.lower()

        # Restore common medical acronyms to uppercase
        for ac in _ACRONYMS:
            lowered = lowered.replace(f" {ac} ", f" {ac.upper()} ")
            lowered = lowered.replace(f"({ac})", f"({ac.upper()})")
            lowered = lowered.replace(f"{ac}-", f"{ac.upper()}-")
            lowered = lowered.replace(f"-{ac}", f"-{ac.upper()}")

        new_lines.append(lowered)

    return "\n".join(new_lines)


def apply_impression_fallback(text: str) -> str:
    """
    Ensures IMPRESSION is never empty or meaningless.
    Applies a safe fallback if the model does not generate a usable impression.
    """
    if not text:
        return "FINDINGS:\n\nIMPRESSION:\nnormal chest radiograph with no evidence of acute cardiopulmonary abnormality."

    up = text.upper()
    if "IMPRESSION:" not in up:
        return text.rstrip() + "\n\nIMPRESSION:\nnormal chest radiograph with no evidence of acute cardiopulmonary abnormality."

    parts = re.split(r'IMPRESSION:', text, flags=re.IGNORECASE)
    findings = parts[0]
    impression = parts[1].strip()

    if len(impression.replace(".", "").replace("-", "").strip()) < 20:
        impression = "normal chest radiograph with no evidence of acute cardiopulmonary abnormality."

    return findings.rstrip() + "\n\nIMPRESSION:\n" + impression.lower().strip()


def load_model(token: str = HF_TOKEN):
    """
    Load the base model and apply LoRA adapter.
    Thread-safe singleton pattern to prevent multiple loads.
    """
    global _MODEL_CACHE, _LOADING_LOCK

    if _MODEL_CACHE is not None:
        return _MODEL_CACHE

    if _LOADING_LOCK:
        import time
        while _LOADING_LOCK:
            time.sleep(0.5)
        return _MODEL_CACHE

    try:
        _LOADING_LOCK = True

        base_model = AutoModelForVision2Seq.from_pretrained(
            BASE_MODEL_ID,
            trust_remote_code=True,
            torch_dtype=torch.float16,
            device_map="auto",
            token=token,
            low_cpu_mem_usage=False  # faster startup; change to True if RAM constrained
        )

        model = PeftModel.from_pretrained(
            base_model,
            MODEL_ID,
            token=token,
            torch_dtype=torch.float16
        )

        model = model.merge_and_unload()
        model.eval()

        # Optional PyTorch inference optimizations
        try:
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.benchmark = True
        except Exception:
            pass

        processor = AutoProcessor.from_pretrained(
            BASE_MODEL_ID,
            trust_remote_code=True,
            token=token
        )

        _MODEL_CACHE = (processor, model)
        return _MODEL_CACHE

    finally:
        _LOADING_LOCK = False


def _build_prompt(prior_text, bmi, age, sex, view_type) -> str:
    """
    Radiologist-grade prompt that enforces:
    - clear FINDINGS
    - complete IMPRESSION
    - strict structure
    - comparison only when relevant
    """
    return f"""
You are an experienced board-certified radiologist.

Analyze the chest X-ray and generate a clean, professional radiology report
with the structure and clarity used in diagnostic practice.

STRICT FORMAT:

FINDINGS:
Provide an objective description of:
- Lungs and pleura
- Heart size and mediastinum
- Pulmonary vasculature
- Diaphragm and costophrenic angles
- Bones and soft tissues
If the study appears normal, state the normal findings. If abnormal, describe only what is seen.
Use a single comparison sentence only if prior findings are provided and relevant.

IMPRESSION:
This section must contain 1 to 3 concise diagnostic statements.
If normal, write: "normal chest radiograph with no evidence of acute cardiopulmonary abnormality."
Do not include disclaimers, recommendations, timestamps, or boilerplate text.

Patient: {age}-year-old {sex}, BMI {bmi}, view type: {view_type}.
Prior report summary: {prior_text if prior_text else "No prior report available."}
""".strip()


def clean_report_text(text: str) -> str:
    """
    Very-light cleaning + Option B lowercase:
    - keep content from FINDINGS onward
    - drop obvious garbage phrases
    - ensure IMPRESSION present
    - normalize spacing
    - lowercase sentences while preserving headers and acronyms
    - guarantee a non-empty impression
    """
    if not text:
        return text

    # Keep only from FINDINGS onward if present
    up = text.upper()
    if "FINDINGS:" in up:
        idx = up.index("FINDINGS:")
        text = text[idx:]

    # Remove trailing junk markers
    low = text.lower()
    for g in _GARBAGE_PHRASES:
        i = low.find(g)
        if i != -1:
            text = text[:i].strip()
            break

    # Ensure IMPRESSION header exists
    if "IMPRESSION:" not in text.upper():
        text += "\n\nIMPRESSION:\n"

    # Normalize blank lines
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text).strip()

    # Lowercase sentences but keep headers uppercase and acronyms uppercase
    text = lowercase_sentences(text)

    # Fallback to ensure impression is not empty or meaningless
    text = apply_impression_fallback(text)

    return text


def predict_report(model_bundle, image: Image.Image, prior_text, bmi, age, sex, view_type):
    """
    Generate a radiology report using the enhanced prompt and cleaner.
    Returns only the cleaned text.
    """
    processor, model = model_bundle

    user_prompt = _build_prompt(prior_text, bmi, age, sex, view_type)

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

    with torch.no_grad():
        generated_ids = model.generate(
            **inputs,
            max_new_tokens=350,
            temperature=0.4,
            top_p=0.75,
            repetition_penalty=1.2,
            no_repeat_ngram_size=3,
            do_sample=True,
            pad_token_id=processor.tokenizer.eos_token_id,
            eos_token_id=processor.tokenizer.eos_token_id
        )

    prompt_len = inputs["input_ids"].shape[1]
    tokens = generated_ids[0, prompt_len:]
    raw_text = processor.decode(tokens, skip_special_tokens=True).strip()

    cleaned_text = clean_report_text(raw_text)
    return {"full_text": cleaned_text}
