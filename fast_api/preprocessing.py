import re
from transformers import AutoProcessor
from PIL import Image

processor = AutoProcessor.from_pretrained("Awinpang/smolvlm-chestxray-finetuned")

def preprocess_image(image):
    """Convert to PIL Image if needed"""
    if not isinstance(image, Image.Image):
        image = Image.open(image).convert("RGB")
    return image

def clean_prior_report(text):
    """Clean prior report by removing metadata sections."""
    if not text:
        return text
    text = re.sub(r'(?i)history:.*?(?=comparison:|findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)technique:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+(?:at|@)\s+\d{1,2}:\d{2})?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'(?i)end\s+of\s+(?:impression|report)', '', text)
    text = re.sub(r'(?i)summary:.*?(?=impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def remove_hallucinated_findings(text):
    """Remove anatomically irrelevant findings for chest X-rays."""
    if not text:
        return text
    
    irrelevant_patterns = [
        r'demineralization of the teeth',
        r'the teeth.*?(?=[.!?]|$)',
        r'visual osseous structure.*?(?=\.|$)',
        r'diffuse osteopenia of the soft tissues',
        r'osctotic calcifications',
        r'the liver appears normal',
        r'the liver.*?(?=[.!?]|$)',
        r'the patient\'s airway',
        r'ventilator pressure.*?(?=[.!?]|$)',
        r'soft tissue nasogastric tube is not visualized',
        r'dental.*?(?=[.!?]|$)',
        r'teeth.*?(?=[.!?]|$)',
        r'sinuses appear normal',
        r'the sinuses.*?(?=[.!?]|$)',
    ]
    
    for pattern in irrelevant_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)
    
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s+\.', '.', text)
    text = re.sub(r'\.(\s*)(?=[a-z])', r'.\1', text)
    
    return text.strip()

def fix_text_corruption(text):
    """Fix common text corruption issues in generated reports."""
    if not text:
        return text
    
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)
    
    medical_terms = [
        'assessment', 'findings', 'impression', 'limited', 'secondary',
        'evaluation', 'imaging', 'radiograph', 'examination', 'view'
    ]
    
    for term in medical_terms:
        pattern = rf'({term})([a-z]+)'
        if re.search(pattern, text, re.IGNORECASE):
            text = re.sub(pattern, rf'\1 \2', text, flags=re.IGNORECASE)
    
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
    
    text = re.sub(r'(\.)([a-z])', r'\1 \2', text)
    text = re.sub(r'(,)([a-z])', r'\1 \2', text)
    text = re.sub(r' +', ' ', text)
    text = re.sub(r'(?:^|[.!?]\s)([a-z])', lambda m: m.group(0).upper(), text)
    text = re.sub(r'(?i)\bfindings:', 'FINDINGS:', text)
    text = re.sub(r'(?i)\bimpression:', 'IMPRESSION:', text)
    
    return text.strip()

def clean_generated_report(text):
    """Clean generated report text."""
    if not text:
        return text
    
    text = fix_text_corruption(text)
    text = re.sub(r'(?i)history:.*?(?=comparison:|findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    
    headers = []
    for match in re.finditer(r'\b(FINDINGS|IMPRESSION):', text):
        headers.append((match.start(), match.end(), match.group(1)))
    
    text = text.lower()
    
    for start, end, header in reversed(headers):
        text = text[:start] + header + ':' + text[end:]
    
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()
    text = re.sub(r'\bfindings:', 'FINDINGS:', text, flags=re.IGNORECASE)
    text = re.sub(r'\bimpression:', 'IMPRESSION:', text, flags=re.IGNORECASE)
    text = remove_hallucinated_findings(text)
    
    return text

def fix_clinical_phrasing(text):
    """Fix common awkward clinical phrasings."""
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