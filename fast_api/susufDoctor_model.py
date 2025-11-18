import os
import requests
import base64
import time
from dotenv import load_dotenv

from preprocessing import (
    clean_prior_report,
    clean_generated_report,
    fix_clinical_phrasing,
)

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME", "Awinpang/smolvlm500-finetuned-xray")
HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{MODEL_ID}"

system_message = "You are an expert radiologist specialized in chest X-ray interpretation."


def call_hf_inference(image_b64: str, prompt: str) -> dict:
    """Call HuggingFace Inference API"""
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    
    payload = {
        "inputs": {
            "image": image_b64,
            "text": prompt
        }
    }
    
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=120)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}


def build_prompt(prior_text, age, sex, bmi, view_type):
    prior_clean = prior_text.strip() if prior_text.strip() else "No prior study available."

    return f"""
Analyze this chest X-ray and generate a structured radiology report.

Patient Information:
- Age: {age}
- Sex: {sex}
- BMI: {bmi}
- View: {view_type}

Prior Report (for comparison):
{prior_clean}

IMPORTANT — Output MUST include:

FINDINGS:
- Describe lungs, pleura, mediastinum, bones, soft tissues
- Describe tubes, lines, devices
- Describe abnormalities
- If prior exists: describe interval change

IMPRESSION:
- Concise interpretation
- Mention improvement / worsening / new findings
- Compare to prior if applicable
""".strip()


# Inference via HuggingFace API
def predict_report(
    image,
    prior_text="",
    bmi="unknown",
    age="unknown",
    sex="unknown",
    view_type="unknown",
    max_new_tokens=512,
    temperature=0.3,
    top_p=0.8,
):
    """Generate radiology report using HuggingFace Inference API"""
    
    print("Running SuSufDoctor inference via HF API...")
    start = time.time()

    # Clean prior report
    if prior_text.strip():
        prior_text = clean_prior_report(prior_text)

    # Build prompt
    prompt = build_prompt(prior_text, age, sex, bmi, view_type)
    
    # Convert image to base64
    if isinstance(image, bytes):
        image_b64 = base64.b64encode(image).decode('utf-8')
    else:
        # If PIL Image, convert to bytes first
        from io import BytesIO
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        image_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    # Call HuggingFace API
    result = call_hf_inference(image_b64, prompt)
    
    if "error" in result:
        return {
            "full_text": f"Error: {result['error']}",
            "raw": result.get('error', 'Unknown error'),
            "mode": "error"
        }
    
    # Extract generated text
    if isinstance(result, list) and len(result) > 0:
        raw = result[0].get("generated_text", "")
    else:
        raw = result.get("generated_text", "")
    
    # Apply preprocessing
    cleaned = clean_generated_report(raw)
    cleaned = fix_clinical_phrasing(cleaned)

    elapsed = time.time() - start
    print(f"Done in {elapsed:.1f}s — length: {len(cleaned)} chars")

    return {
        "full_text": cleaned,
        "raw": raw,
        "mode": "longitudinal" if prior_text else "single-study",
    }