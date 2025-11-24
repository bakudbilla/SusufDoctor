import re
from transformers import AutoProcessor
from PIL import Image

processor = AutoProcessor.from_pretrained("Awinpang/smolvlm500-finetuned-xray")

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
    """Clean and normalize generated chest X-ray reports."""
    if not text:
        return text
    
    # Step 1 — Fix capitalization, spacing, corruption
    text = fix_text_corruption(text)

    # Step 2 — Remove any SUMMARY sections (strict)
    text = re.sub(r'(?i)summary\s*[\d:.-]*.*?(?=impression:|findings:|$)', '', text, flags=re.DOTALL)

    # Also delete inline summary phrases
    summary_phrases = [
        r"summary\s*\d*[:\-]?",
        r"this is the output i am getting.*",
        r"go ahead if you have additional findings.*",
        r"possibly related to underlying disease.*",
        r"but not specifically limited to this study.*",
    ]
    for pattern in summary_phrases:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Step 3 — Remove other irrelevant LLM gibberish
    gibberish_patterns = [
        r"if you have additional findings.*",
        r"would you like to suggest a name.*",
        r"this section.*?(?=[.!?]|$)",
        r"note that this is automatically generated.*",
        r"based on the context of the study.*",
    ]
    for pattern in gibberish_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # Step 4 — Remove metadata sections
    text = re.sub(r'(?i)history:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)

    # Step 5 — Force correct header formatting
    text = text.lower()
    text = re.sub(r'\bfindings:', 'FINDINGS:', text, flags=re.IGNORECASE)
    text = re.sub(r'\bimpression:', 'IMPRESSION:', text, flags=re.IGNORECASE)

    # Step 6 — Remove hallucinated or anatomically irrelevant content
    text = remove_hallucinated_findings(text)

    # Step 7 — Clean whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Step 8 — Ensure FINDINGS/IMPRESSION appear at correct positions
    # If only impression is present, keep it
    if "FINDINGS:" not in text and "IMPRESSION:" in text:
        text = "FINDINGS: No acute abnormality.\n" + text

    return text.strip()


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