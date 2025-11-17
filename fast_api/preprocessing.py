import re
from transformers import AutoProcessor
from PIL import Image

# Load the processor from the merged model
processor = AutoProcessor.from_pretrained("Awinpang/smolvlm500-finetuned-xray")

def preprocess_image(image):
    """Convert to PIL Image if needed"""
    if not isinstance(image, Image.Image):
        image = Image.open(image).convert("RGB")
    return image

def clean_prior_report(text):
    """
    Clean prior report by removing HISTORY, COMPARISON, and other metadata.
    Keep only the actual findings/impression content.
    """
    if not text:
        return text
    
    # Remove HISTORY section
    text = re.sub(r'(?i)history:.*?(?=comparison:|findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Remove COMPARISON section
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Remove PROCEDURE COMMENTS section
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Remove TECHNIQUE section
    text = re.sub(r'(?i)technique:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Remove dates/times
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+(?:at|@)\s+\d{1,2}:\d{2})?', '', text, flags=re.IGNORECASE)
    
    # Remove junk text
    text = re.sub(r'(?i)end\s+of\s+(?:impression|report)', '', text)
    text = re.sub(r'(?i)summary:.*?(?=impression:|$)', '', text, flags=re.DOTALL)
    
    # Clean whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    return text

def fix_text_corruption(text):
    """
    Fix common text corruption issues in generated reports:
    - Words joined together without spaces
    - Missing spaces after punctuation
    - Garbled section headers
    """
    if not text:
        return text
    
    # Fix 1: Add spaces between lowercase and uppercase (camelCase to normal)
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    
    # Fix 2: Add spaces after common medical terms that might be joined
    medical_terms = [
        'assessment', 'findings', 'impression', 'limited', 'secondary',
        'evaluation', 'imaging', 'radiograph', 'examination', 'view'
    ]
    
    for term in medical_terms:
        pattern = rf'({term})([a-z]+)'
        if re.search(pattern, text, re.IGNORECASE):
            text = re.sub(pattern, rf'\1 \2', text, flags=re.IGNORECASE)
    
    # Fix 3: Fix common corruptions from model output
    corruption_fixes = {
        'neumothorax': 'pneumothorax',
        'orotherabdominal': 'or other abdominal',
        'astharaicinjury': 'aortic injury',
        'vangiagram': 'angiogram',
        'tpatient': 'the patient',
        'portabletechnique': 'portable technique',
    }
    
    for wrong, correct in corruption_fixes.items():
        text = re.sub(rf'\b{wrong}\b', correct, text, flags=re.IGNORECASE)
    
    # Fix 4: Add space before punctuation and after
    text = re.sub(r'(\.)([a-z])', r'\1 \2', text)
    text = re.sub(r'(,)([a-z])', r'\1 \2', text)
    
    # Fix 5: Fix multiple spaces back to single space
    text = re.sub(r' +', ' ', text)
    
    # Fix 6: Capitalize first letter of sentences
    text = re.sub(r'(?:^|[.!?]\s)([a-z])', lambda m: m.group(0).upper(), text)
    
    # Fix 7: Ensure section headers are properly formatted
    text = re.sub(r'(?i)\bfindings:', 'FINDINGS:', text)
    text = re.sub(r'(?i)\bimpression:', 'IMPRESSION:', text)
    
    return text.strip()

def clean_generated_report(text):
    """
    Clean generated report text:
    - Fix text corruption
    - Remove HISTORY/COMPARISON sections
    - Convert to lowercase
    - Capitalize section headers
    """
    if not text:
        return text
    
    # Fix corruption first
    text = fix_text_corruption(text)
    
    # Remove HISTORY section
    text = re.sub(r'(?i)history:.*?(?=comparison:|findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Remove COMPARISON section
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Remove PROCEDURE COMMENTS section
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    # Convert to lowercase
    text = text.lower()
    
    # Clean up excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    
    # Capitalize section headers
    text = re.sub(r'\bfindings:', 'FINDINGS:', text)
    text = re.sub(r'\bimpression:', 'IMPRESSION:', text)
    
    return text

def fix_clinical_phrasing(text):
    """Fix common awkward clinical phrasings in generated reports"""
    if not text:
        return text
    
    fixes = {
        'has also been removed': 'has improved',
        'removed from this study': 'compared to prior',
        'focused consolidation': 'focal consolidation',
        'edema has also been removed': 'edema has improved',
    }
    
    for wrong, correct in fixes.items():
        text = text.replace(wrong, correct)
    
    return text