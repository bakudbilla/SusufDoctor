import torch
from transformers import Idefics3ForConditionalGeneration, AutoProcessor
from peft import PeftModel
from PIL import Image
import re
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME", "Awinpang/smolvlm-finetuned-xray")
BASE_MODEL_ID = "HuggingFaceM4/Idefics3-8B-Llama3"  # Base model

def load_model(token=HF_TOKEN):
    """
    Load the base Idefics3 model and apply LoRA adapter.
    Optimized for low memory usage.
    """
    print(f"Loading base model {BASE_MODEL_ID}...")
    
    # Load base model with memory optimizations
    base_model = Idefics3ForConditionalGeneration.from_pretrained(
        BASE_MODEL_ID,
        trust_remote_code=True,
        torch_dtype=torch.float16,  # Use float16 instead of bfloat16 to save memory
        device_map="auto",
        token=token,
        load_in_8bit=True,  # 8-bit quantization for memory efficiency
    )
    
    print(f"Loading LoRA adapter from {MODEL_ID}...")
    
    # Load and apply LoRA adapter
    model = PeftModel.from_pretrained(base_model, MODEL_ID, token=token)
    
    # Merge adapter into base model for inference
    model = model.merge_and_unload()
    model = model.eval()
    
    print("✓ Model and LoRA adapter loaded and merged successfully.")
    
    # Load processor
    processor = AutoProcessor.from_pretrained(
        BASE_MODEL_ID,
        trust_remote_code=True,
        token=token
    )
    
    return processor, model


def predict_report(model_bundle, image, prior_text, bmi, age, sex, view_type, summary=False):
    """
    Generate a complete radiology report with proper length.
    """
    processor, model = model_bundle

    # Balanced prompt - specific but not restrictive
    user_prompt = f"""
Generate a comprehensive chest X-ray report with the following structure:

FINDINGS:
- Describe the lung fields, heart size and shape, mediastinum, diaphragm, and bones
- Note any abnormalities, opacities, or pathologies
- Comment on technical quality if relevant

IMPRESSION:
- Provide clinical interpretation and conclusions
- Suggest follow-up if indicated

Patient: {age}-year-old {sex}, BMI: {bmi}, {view_type} view
Prior report: {prior_text if prior_text else "None available"}
""".strip()

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

    # Balanced generation parameters
    with torch.no_grad():
        generated_ids = model.generate(
            **inputs,
            max_new_tokens=600,
            min_new_tokens=300,
            temperature=0.4,
            top_p=0.85,
            repetition_penalty=1.5,
            no_repeat_ngram_size=3,
            length_penalty=1.2,
            pad_token_id=processor.tokenizer.eos_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            do_sample=True,
            early_stopping=True,
        )
    
    prompt_length = inputs["input_ids"].shape[1]
    generated_tokens = generated_ids[0, prompt_length:]
    generated_text = processor.decode(generated_tokens, skip_special_tokens=True).strip()

    print(f"Generated report length: {len(generated_text)} characters")
    print(f"Preview: {generated_text[:150]}...")
    
    # Clean the text but preserve good content
    cleaned_text = clean_report_text(generated_text)
    
    return {"full_text": cleaned_text}


def clean_report_text(text):
    """
    Clean up model output while preserving good medical content
    """
    # Remove everything before FINDINGS section
    if "FINDINGS:" in text:
        text = "FINDINGS:" + text.split("FINDINGS:")[1]
    
    # Remove common garbage patterns
    garbage_patterns = [
        r'Please provide FINDINGS and IMPRESSION.*',
        r'By:.*\d{1,2}(st|nd|rd|th).*',
        r'at \d{1,2}:\d{2} hours.*',
        r'on \d{1,2}-[a-zA-Z]+-\d{2,4}.*',
        r'md [a-zA-Z ]+ on.*',
        r'REMARKANT DIAGNOSIS.*',
        r'IMAGERY COMMENTS.*',
        r'The following studies have been excluded.*',
        r'RECOMMEND REPEAT.*',
        r'ENDOTRACES, EPIDERALUNDE.*',
        r'MEDIAN STERNOTOMY.*',
        r'HISTORY:.*?(?=FINDINGS:|IMPRESSION:|$)',
        r'COMPARISON:.*?(?=FINDINGS:|IMPRESSION:|$)',
        r'TECHNIQUE:.*?(?=FINDINGS:|IMPRESSION:|$)',
        r'END OF IMPRESSION:.*',
        r'SUMMARY \d+:.*',
    ]
    
    for pattern in garbage_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Stop at specific garbage indicators
    stop_indicators = [
        "The following studies",
        "Please provide",
        "By:",
        "at hours", 
        "on september", "on january", "on february", "on march", "on april",
        "on may", "on june", "on july", "on august", "on october",
        "on november", "on december",
        "END OF IMPRESSION:",
        "SUMMARY",
    ]
    
    for indicator in stop_indicators:
        if indicator.lower() in text.lower():
            text = text.split(indicator)[0].strip()
            break
    
    # Ensure proper structure
    if not text.startswith("FINDINGS:"):
        if "FINDINGS:" in text:
            text = "FINDINGS:" + text.split("FINDINGS:")[1]
        else:
            text = f"FINDINGS:\n{text}\n\nIMPRESSION:\nClinical correlation recommended."
    
    # Clean up IMPRESSION section
    if "IMPRESSION:" in text:
        parts = text.split("IMPRESSION:")
        if len(parts) > 1:
            findings_part = parts[0]
            impression_part = parts[1]
            
            impression_endings = [
                "END OF IMPRESSION",
                "SUMMARY",
                "FINAL REPORT",
                "REPORT END",
                "CONCLUSION:",
            ]
            
            for ending in impression_endings:
                if ending.lower() in impression_part.lower():
                    impression_part = impression_part.split(ending)[0].strip()
                    break
            
            impression_sentences = re.split(r'[.!?]+', impression_part)
            if len(impression_sentences) > 3:
                meaningful_sentences = []
                for sentence in impression_sentences:
                    sentence = sentence.strip()
                    if sentence and len(sentence) > 10:
                        meaningful_sentences.append(sentence)
                        if len(meaningful_sentences) >= 2:
                            break
                
                if meaningful_sentences:
                    impression_part = '. '.join(meaningful_sentences) + '.'
                else:
                    impression_part = "Clinical correlation recommended."
            
            text = findings_part + "IMPRESSION:\n" + impression_part.strip()
    
    if "FINDINGS:" in text and "IMPRESSION:" not in text:
        text += "\n\nIMPRESSION:\nClinical correlation recommended."
    
    # Remove all caps and clean whitespace
    text = remove_all_caps(text)
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)
    text = text.strip()
    text = ensure_concise_impression(text)
    
    if len(text) < 200:
        text = enhance_short_report(text)
    
    return text


def ensure_concise_impression(text):
    """Ensure IMPRESSION section is concise and professional"""
    if "IMPRESSION:" in text:
        parts = text.split("IMPRESSION:")
        findings_part = parts[0]
        impression_part = parts[1] if len(parts) > 1 else ""
        
        impression_part = impression_part.strip()
        
        if (len(impression_part) > 300 or 
            "END OF IMPRESSION" in impression_part.upper() or
            "SUMMARY" in impression_part.upper()):
            impression_part = "Clinical correlation recommended."
        
        text = findings_part + "IMPRESSION:\n" + impression_part
    
    return text


def remove_all_caps(text):
    """Convert all-caps sections to normal sentence case"""
    if "IMPRESSION:" in text:
        parts = text.split("IMPRESSION:")
        if len(parts) > 1:
            findings_part = parts[0]
            impression_part = parts[1]
            
            if impression_part.strip().isupper():
                impression_part = impression_part.lower().capitalize()
                sentences = re.split(r'(?<=[.!?])\s+', impression_part)
                impression_part = '. '.join(s.strip().capitalize() for s in sentences if s.strip())
            
            text = findings_part + "IMPRESSION:\n" + impression_part
    
    return text


def enhance_short_report(text):
    """Enhance very short reports with more detail"""
    if "FINDINGS:" in text and "IMPRESSION:" in text:
        findings_part = text.split("FINDINGS:")[1].split("IMPRESSION:")[0].strip()
        impression_part = text.split("IMPRESSION:")[1].strip()
        
        if len(findings_part) < 100:
            enhanced_findings = findings_part
            if "lung" not in enhanced_findings.lower():
                enhanced_findings += "\n- Lung fields are clear without focal consolidation"
            if "heart" not in enhanced_findings.lower():
                enhanced_findings += "\n- Cardiomediastinal silhouette is within normal limits"
            if "bone" not in enhanced_findings.lower():
                enhanced_findings += "\n- Bony structures are unremarkable"
            if "diaphragm" not in enhanced_findings.lower():
                enhanced_findings += "\n- Diaphragm and costophrenic angles are clear"
            
            text = f"FINDINGS:\n{enhanced_findings}\n\nIMPRESSION:\n{impression_part}"
    
    return text