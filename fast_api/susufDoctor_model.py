import os
import torch
import time
from transformers import Idefics3ForConditionalGeneration, AutoProcessor
from dotenv import load_dotenv

from preprocessing import (
    clean_prior_report,
    clean_generated_report,
    fix_clinical_phrasing,
)

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME", "Awinpang/smolvlm500-finetuned-xray")

_MODEL_CACHE = None
_LOADING = False

system_message = "You are an expert radiologist specialized in chest X-ray interpretation."


# Load the model
def load_model(token=HF_TOKEN):
    global _MODEL_CACHE, _LOADING

    if _MODEL_CACHE:
        return _MODEL_CACHE

    if _LOADING:
        while _LOADING:
            time.sleep(0.5)
        return _MODEL_CACHE

    try:
        _LOADING = True
        print("Loading SuSufDoctor model...")

        model = Idefics3ForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            token=token,
        )

        processor = AutoProcessor.from_pretrained(MODEL_ID, token=token)
        model.eval()

        _MODEL_CACHE = (processor, model)
        print("Model ready.")
        return _MODEL_CACHE

    finally:
        _LOADING = False


# BUILD PROMPT

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


#Inference
def predict_report(
    model_bundle,
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
    processor, model = model_bundle

    print(" Running SuSufDoctor inference...")
    start = time.time()

    # Clean prior report
    if prior_text.strip():
        prior_text = clean_prior_report(prior_text)

    # Build prompt
    prompt = build_prompt(prior_text, age, sex, bmi, view_type)

    messages = [
        {
            "role": "system",
            "content": [{"type": "text", "text": system_message}],
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image", "image": image},   
            ],
        },
    ]

    # Chat template 
    prompt_text = processor.apply_chat_template(
        messages,
        add_generation_prompt=True,
        tokenize=False,
    )

    # Convert to tensors
    inputs = processor(
        text=prompt_text,
        images=[image],  
        return_tensors="pt",
        padding=True,
    ).to(model.device)

    # Generate
    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            do_sample=True,
            top_p=top_p,
            top_k=50,
            repetition_penalty=1.18,
            pad_token_id=processor.tokenizer.eos_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
        )

    # Decode new tokens only
    prompt_len = inputs["input_ids"].shape[1]
    new_tokens = output_ids[0, prompt_len:]
    raw = processor.decode(new_tokens, skip_special_tokens=True).strip()

    # Cleanup
    cleaned = clean_generated_report(raw)
    cleaned = fix_clinical_phrasing(cleaned)

    print(f"Done in {time.time() - start:.1f}s — length: {len(cleaned)} chars")

    return {
        "full_text": cleaned,
        "raw": raw,
        "mode": "longitudinal" if prior_text else "single-study",
    }
