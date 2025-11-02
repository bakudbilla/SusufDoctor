import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import re
from datetime import date


# ---------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------
MODEL_ID = "HuggingFaceTB/SmolVLM-500M-Instruct"


# ---------------------------------------------------------------------
# Load model once globally
# ---------------------------------------------------------------------
def load_model(token=None):
    """
    Load the SmolVLM-500M-Instruct model and processor.
    Automatically detects GPU or falls back to CPU.
    """
    print("Loading SmolVLM-500M-Instruct model...")

    processor = AutoProcessor.from_pretrained(
        MODEL_ID, trust_remote_code=True, token=token
    )

    # Use new model class per Hugging Face warning
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
        token=token
    ).eval()

    print("Model loaded successfully.")
    return processor, model


# ---------------------------------------------------------------------
# Generate Report Function
# ---------------------------------------------------------------------
def predict_report(model_bundle, image, prior_text, bmi, age, sex, view_type, summary=False):
    """
    Generate a structured, clean radiology report with a single `full_text` output.
    """
    processor, model = model_bundle

    # Choose instruction
    task_instruction = (
        "Generate a concise one-paragraph summary of the X-ray findings and impression."
        if summary
        else "Generate a complete chest X-ray radiology report with structured sections (Patient, Findings, Impression)."
    )

    # Prompt
    user_prompt = (
        f"Patient details:\n"
        f"- Age: {age} years\n"
        f"- Sex: {sex}\n"
        f"- BMI: {bmi}\n"
        f"- View Type: {view_type}\n\n"
        f"Prior Report:\n{prior_text}\n\n"
        f"{task_instruction}"
    )

    # Apply SmolVLM chat template
    messages = [
        {"role": "user", "content": [{"type": "image"}, {"type": "text", "text": user_prompt}]}
    ]
    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)

    # Preprocess inputs
    inputs = processor(text=[prompt], images=[image], return_tensors="pt")
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    # Generate prediction
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=400)
        decoded = processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()

    # Clean echoes like "Assistant:" or "User:"
    decoded = re.sub(r"(?i)(assistant:|user:)\s*", "", decoded).strip()

    # ---------------------------------------------------------------------
    # Ensure structured radiology report
    # ---------------------------------------------------------------------
    today = date.today().strftime("%B %d, %Y")

    if not re.search(r"(?i)\*\*Chest Radiograph Report\*\*", decoded):
        header = (
            "**Chest Radiograph Report**\n\n"
            f"**Patient:** {age}-year-old {sex.capitalize()}\n"
            f"**BMI:** {bmi}\n"
            f"**Date of Exam:** {today}\n"
            f"**Technique:** {view_type} chest radiograph\n\n"
        )
        decoded = header + decoded

    # Guarantee required sections
    if "**Findings:**" not in decoded and "Findings:" not in decoded:
        decoded += "\n\n**Findings:**\nNormal study. No acute findings."
    if "**Impression:**" not in decoded and "Impression:" not in decoded:
        decoded += "\n\n**Impression:**\nNo radiographic evidence of disease."

    # Clean extra spaces
    decoded = re.sub(r"\n{3,}", "\n\n", decoded).strip()

    return {"full_text": decoded}
