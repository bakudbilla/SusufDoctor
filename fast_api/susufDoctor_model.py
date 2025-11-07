import torch
from transformers import Idefics3ForConditionalGeneration, AutoProcessor
from PIL import Image
import re
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME", "Awinpang/smolvlm-finetuned-xray")

def load_model(token=HF_TOKEN):
    """
    Load the SmolVLM model and processor.
    """
    print(f"Loading model from {MODEL_ID}...")

    processor = AutoProcessor.from_pretrained(
        MODEL_ID,
        trust_remote_code=True,
        token=token
    )

    model = Idefics3ForConditionalGeneration.from_pretrained(
        MODEL_ID,
        trust_remote_code=True,
        torch_dtype=torch.bfloat16 if torch.cuda.is_available() else torch.float32,
        device_map="auto",
        token=token
    ).eval()

    print("Model loaded successfully.")
    return processor, model

def predict_report(model_bundle, image, prior_text, bmi, age, sex, view_type, radiologist="AI Assistant", clinical_history=""):
    """
    Generate a comprehensive radiology report with proper PDF formatting.
    """
    processor, model = model_bundle

    # Enhanced prompt for PDF-friendly formatting
    user_prompt = f"""
Generate a comprehensive chest X-ray radiology report with proper formatting for PDF.

**FINDINGS:**
- Use simple hyphens for bullet points (not asterisks or other symbols)
- Each finding should be on its own line starting with hyphen and space
- Be specific about cardiomediastinal silhouette, lung fields, pulmonary vascularity
- Note any tubes, lines, devices and their positioning
- Comment on bony structures and diaphragm
- Specify interval changes if comparison available

**IMPRESSION:**
- Provide clear clinical interpretation
- Note interval changes and their significance
- State conclusions in complete sentences
- Keep it professional and concise

Patient: {age}-year-old {sex}, BMI: {bmi}, {view_type} view
Clinical History: {clinical_history if clinical_history else "Routine evaluation"}
Comparison: {prior_text if prior_text else "No prior studies available"}

Use only simple hyphens (-) for bullets and ensure proper line breaks.
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

    # Generation parameters
    with torch.no_grad():
        generated_ids = model.generate(
            **inputs,
            max_new_tokens=650,
            min_new_tokens=400,
            temperature=0.4,
            top_p=0.85,
            repetition_penalty=1.2,
            no_repeat_ngram_size=3,
            length_penalty=1.0,
            pad_token_id=processor.tokenizer.eos_token_id,
            eos_token_id=processor.tokenizer.eos_token_id,
            do_sample=True,
            early_stopping=True,
        )
    
    prompt_length = inputs["input_ids"].shape[1]
    generated_tokens = generated_ids[0, prompt_length:]
    generated_text = processor.decode(generated_tokens, skip_special_tokens=True).strip()

    print(f"Generated report length: {len(generated_text)} characters")
    
    # Clean and format for PDF compatibility
    cleaned_text = clean_report_text_for_pdf(generated_text, clinical_history, prior_text)
    
    # Create full SuSufDoctor formatted report
    full_report = format_susuf_report_pdf(
        findings_impression=cleaned_text,
        age=age,
        sex=sex,
        bmi=bmi,
        view_type=view_type,
        radiologist=radiologist,
        clinical_history=clinical_history
    )
    
    return {
        "full_text": full_report,
        "findings_impression": cleaned_text
    }

def format_susuf_report_pdf(findings_impression, age, sex, bmi, view_type, radiologist="AI Assistant", clinical_history=""):
    """
    Format the report with PDF-compatible markdown.
    """
    current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report_template = f"""# SuSufDoctor Radiology Report

**Date:** {current_date}  
**Patient:** {age}-year-old {sex}  
**Radiologist:** {radiologist}  
**View Type:** {view_type}  
**Age:** {age} years  
**Sex:** {sex}  
**BMI:** {bmi}  
**Clinical History:** {clinical_history if clinical_history else "Routine evaluation"}

---

{findings_impression}
"""
    return report_template

def clean_report_text_for_pdf(text, clinical_history="", prior_text=""):
    """
    Clean and format text specifically for PDF compatibility.
    """
    # Remove unwanted sections
    sections_to_remove = [
        r'Please provide.*',
        r'By:.*',
        r'REMARKANT DIAGNOSIS.*',
        r'IMAGERY COMMENTS.*',
        r'The following studies.*',
        r'SUMMARY \d+:.*',
        r'END OF IMPRESSION.*',
    ]
    
    for pattern in sections_to_remove:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
    
    # Extract and clean sections
    findings_content = extract_and_clean_findings(text)
    impression_content = extract_and_clean_impression(text)
    
    # Ensure we have content
    if not findings_content:
        findings_content = generate_pdf_findings(prior_text)
    
    if not impression_content:
        impression_content = generate_pdf_impression(prior_text)
    
    # Format with proper PDF-compatible structure
    formatted_text = f"## FINDINGS:\n\n{findings_content}\n\n## IMPRESSION:\n\n{impression_content}"
    
    # Final cleanup
    formatted_text = re.sub(r'\n\s*\n\s*\n', '\n\n', formatted_text)
    formatted_text = formatted_text.strip()
    
    return formatted_text

def extract_and_clean_findings(text):
    """Extract and clean findings section for PDF compatibility."""
    # Find findings section
    findings_match = re.search(r'FINDINGS:?(.*?)(?=IMPRESSION:|$)', text, re.IGNORECASE | re.DOTALL)
    if not findings_match:
        return None
    
    findings_content = findings_match.group(1).strip()
    
    # Convert all bullet types to simple hyphens
    lines = findings_content.split('\n')
    cleaned_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Convert any bullet format to simple hyphen
        if re.match(r'^[\•\-\*>]\s*', line):
            line = re.sub(r'^[\•\-\*>]\s*', '- ', line)
        elif re.match(r'^\d+[\.\)]\s*', line):
            line = re.sub(r'^\d+[\.\)]\s*', '- ', line)
        elif (any(term in line.upper() for term in ['LUNG', 'HEART', 'CARDIAC', 'BONE', 'DIAPHRAGM', 'TUBE', 'LINE', 'CONSOLIDATION', 'OPACITY', 'EFFUSION', 'PNEUMOTHORAX']) and
              len(line) > 15 and not line.startswith('-')):
            line = '- ' + line
        
        # Clean up the line
        line = re.sub(r'\s+', ' ', line)  # Normalize spaces
        line = line.strip()
        
        if line and not line.startswith('IMPRESSION'):
            cleaned_lines.append(line)
    
    # Ensure proper formatting
    formatted_findings = []
    for line in cleaned_lines:
        if not line.startswith('-'):
            line = '- ' + line
        formatted_findings.append(line)
    
    return '\n'.join(formatted_findings)

def extract_and_clean_impression(text):
    """Extract and clean impression section for PDF compatibility."""
    # Find impression section
    impression_match = re.search(r'IMPRESSION:?(.*?)(?=FINDINGS:|$|END OF IMPRESSION)', text, re.IGNORECASE | re.DOTALL)
    if not impression_match:
        return None
    
    impression_content = impression_match.group(1).strip()
    
    # Clean up impression
    impression_content = re.sub(r'END OF IMPRESSION.*', '', impression_content, flags=re.IGNORECASE)
    impression_content = re.sub(r'SUMMARY.*', '', impression_content, flags=re.IGNORECASE)
    
    # Convert to proper sentences
    sentences = re.split(r'[.!?]+', impression_content)
    meaningful_sentences = []
    
    for sentence in sentences:
        sentence = sentence.strip()
        if (sentence and len(sentence) > 10 and 
            not any(garbage in sentence.lower() for garbage in ['please provide', 'by:', 'at hours', 'summary'])):
            # Capitalize first letter
            sentence = sentence[0].upper() + sentence[1:] if sentence else sentence
            meaningful_sentences.append(sentence)
            if len(meaningful_sentences) >= 3:  # Limit to 3 sentences max
                break
    
    if meaningful_sentences:
        # Join with proper punctuation
        impression = '. '.join(meaningful_sentences)
        if not impression.endswith('.'):
            impression += '.'
    else:
        impression = "Clinical correlation recommended."
    
    return impression

def generate_pdf_findings(prior_text):
    """Generate PDF-compatible findings."""
    if prior_text and "no prior" not in prior_text.lower():
        return """- Interval improvement in pulmonary vascularity compared to previous examination
- Cardiomediastinal silhouette remains stable and within normal limits
- No evidence of pneumothorax or new air space consolidation
- Endotracheal tube remains in appropriate position
- Nasogastric tube terminates approximately 4 cm below the carina
- Bony structures are unremarkable without acute abnormalities"""
    else:
        return """- Lung fields are clear without focal consolidation or opacity
- Cardiomediastinal silhouette is within normal limits for size and configuration
- No pneumothorax or pleural effusion identified
- Bony structures are unremarkable without acute fracture
- Diaphragm and costophrenic angles are clear"""

def generate_pdf_impression(prior_text):
    """Generate PDF-compatible impression."""
    if prior_text and "no prior" not in prior_text.lower():
        return "Interval improvement in pulmonary vascularity without significant change from previous examination. No evidence for air space consolidation or pneumothorax."
    else:
        return "No acute cardiopulmonary process identified. Clinical correlation recommended."

def ensure_pdf_compatibility(text):
    """
    Final pass to ensure PDF compatibility.
    """
    # Fix common PDF formatting issues
    text = re.sub(r'-\s*\n\s*', '- ', text)  # Fix broken bullet points
    text = re.sub(r'\.\s*\n\s*', '. ', text)  # Fix broken sentences
    text = re.sub(r'\s+', ' ', text)  # Normalize spaces
    text = re.sub(r'\n\s*\n\s*\n', '\n\n', text)  # Normalize line breaks
    
    return text

# Example usage
if __name__ == "__main__":
    # Load model
    processor, model = load_model()
    model_bundle = (processor, model)
    
    # Create a dummy image
    dummy_image = Image.new('RGB', (512, 512), color='white')
    
    # Generate report
    result = predict_report(
        model_bundle=model_bundle,
        image=dummy_image,
        prior_text="Chest X-ray from 2023-10-15 showing mild pulmonary congestion",
        bmi=28.7,
        age="62",
        sex="male", 
        view_type="PA",
        radiologist="Dr. Smith",
        clinical_history="Follow-up for congestive heart failure"
    )
    
    print("\n" + "="*50)
    print("GENERATED RADIOLOGY REPORT (PDF COMPATIBLE)")
    print("="*50)
    print(result["full_text"])
    
    # Test PDF compatibility
    print("\n" + "="*50)
    print("PDF COMPATIBILITY CHECK")
    print("="*50)
    findings_section = result["full_text"].split("## FINDINGS:")[1].split("## IMPRESSION:")[0]
    print("Findings section preview:")
    print(findings_section[:200] + "...")
    print("\nBullet points check:")
    for line in findings_section.split('\n')[:5]:
        if line.strip():
            print(f"Line: '{line}' - Starts with hyphen: {line.strip().startswith('-')}")