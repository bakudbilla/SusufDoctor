import os
import torch
import time
from transformers import Idefics3ForConditionalGeneration, AutoProcessor
from dotenv import load_dotenv
from preprocessing import clean_prior_report, clean_generated_report, fix_clinical_phrasing, processor

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME", "Awinpang/smolvlm500-finetuned-xray")

_MODEL_CACHE = None
_LOADING_LOCK = False

system_message = "You are an expert radiologist specialized in interpreting chest X-rays."

def load_model(token=HF_TOKEN):
    """Load merged model from Hugging Face Hub"""
    global _MODEL_CACHE, _LOADING_LOCK
    
    if _MODEL_CACHE is not None:
        print("Returning cached model")
        return _MODEL_CACHE
    
    if _LOADING_LOCK:
        print("Model is loading, waiting...")
        while _LOADING_LOCK:
            time.sleep(0.5)
        return _MODEL_CACHE
    
    try:
        _LOADING_LOCK = True
        print("Loading merged model from Hugging Face Hub...")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Device: {device}")
        
        # Load the merged model directly
        model = Idefics3ForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat16,
            device_map="auto",
            token=token
        )
        
        model.eval()
        
        processor_obj = AutoProcessor.from_pretrained(
            MODEL_ID,
            token=token
        )
        
        _MODEL_CACHE = (processor_obj, model)
        print("Model loaded successfully from HF Hub")
        return _MODEL_CACHE
        
    except Exception as e:
        print(f"Error loading model: {e}")
        raise
    finally:
        _LOADING_LOCK = False

def prepare_inference_input(prior_report="", age="unknown", sex="unknown", 
                           bmi="unknown", view="unknown"):
    """Prepare inference input with enforced FINDINGS and IMPRESSION structure"""
    user_prompt = f"""Analyze this chest X-ray and generate a structured radiologist report.

Patient information:
- Age: {age} years
- Sex: {sex}
- BMI: {bmi}
- View: {view}

Prior report (for comparison):
{prior_report if prior_report else "No prior study available"}

IMPORTANT: Your response MUST have TWO sections:

FINDINGS: Describe all visible findings including:
- Lung fields and pulmonary vascularity
- Cardiac silhouette and mediastinum
- Pleural spaces and diaphragms
- Bones and soft tissues
- Any lines, tubes, or devices

IMPRESSION: Clinical interpretation including:
- Key abnormalities identified
- Comparison to prior if available (e.g., "stable", "improved", "new")
- Recommendations if needed

Both FINDINGS and IMPRESSION sections are required. Use clear, concise medical terminology.""".strip()

    messages = [
        {
            "role": "system",
            "content": [{"type": "text", "text": system_message}]
        },
        {
            "role": "user", 
            "content": [
                {"type": "text", "text": user_prompt},
                {"type": "image", "image": None}
            ]
        }
    ]
    
    return messages, user_prompt

def predict_report(model_bundle, image, prior_text="", bmi="unknown", age="unknown", 
                  sex="unknown", view_type="unknown", max_new_tokens=512, 
                  temperature=0.3, top_p=0.8):
    """
    Generate chest X-ray report.
    
    Args:
        model_bundle: (processor, model) tuple from load_model()
        image: PIL Image object
        prior_text: Full prior report text (optional)
        bmi: Patient BMI
        age: Patient age
        sex: Patient sex
        view_type: X-ray view type
        max_new_tokens: Max tokens to generate
        temperature: Generation temperature
        top_p: Top-p sampling
        
    Returns:
        Dictionary with generated report
    """
    try:
        processor_obj, model = model_bundle
        
        print("Generating report...")
        start_time = time.time()
        
        # Clean prior report if provided
        if prior_text and prior_text.strip():
            prior_text = clean_prior_report(prior_text)
            print(f"Prior report cleaned. Length: {len(prior_text)} chars")
        
        # Prepare input in training format
        messages, user_prompt = prepare_inference_input(
            prior_text, age, sex, bmi, view_type
        )
        
        # Create prompt messages (without assistant)
        prompt_messages = [
            {
                "role": "system",
                "content": [{"type": "text", "text": system_message}]
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image"}
                ]
            }
        ]
        
        # Apply chat template
        prompt_text = processor_obj.apply_chat_template(
            prompt_messages,
            add_generation_prompt=True,
            tokenize=False
        )
        
        print(f"Prompt length: {len(prompt_text)} chars")
        
        # Process inputs
        inputs = processor_obj(
            text=prompt_text,
            images=[image],
            return_tensors="pt",
            padding=True
        ).to(model.device)
        
        print("Generating FINDINGS and IMPRESSION...")
        
        # Generate report
        with torch.no_grad():
            generated_ids = model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=temperature,
                top_p=top_p,
                top_k=50,
                repetition_penalty=1.2,
                pad_token_id=processor_obj.tokenizer.eos_token_id,
                eos_token_id=processor_obj.tokenizer.eos_token_id,
                early_stopping=True,
            )
        
        # Decode only newly generated tokens
        prompt_length = inputs["input_ids"].shape[1]
        generated_tokens = generated_ids[0, prompt_length:]
        response = processor_obj.decode(generated_tokens, skip_special_tokens=True).strip()
        
        # Clean the response
        cleaned_response = clean_generated_report(response)
        cleaned_response = fix_clinical_phrasing(cleaned_response)
        
        generation_time = time.time() - start_time
        
        print(f"Completed in {generation_time:.1f}s")
        print(f"Report length: {len(cleaned_response)} chars")
        
        return {
            "full_text": cleaned_response,
            "generation_time": generation_time,
            "mode": "baseline"
        }
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "full_text": "FINDINGS: Technical error during report generation.\n\nIMPRESSION: Clinical correlation recommended.",
            "error": str(e),
            "generation_time": 0,
            "mode": "baseline"
        }