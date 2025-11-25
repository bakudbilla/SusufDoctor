import re
from transformers import AutoProcessor
from PIL import Image

processor = AutoProcessor.from_pretrained("Awinpang/smolvlm500-finetuned-xray")

# IMAGE PREPROCESSING
def preprocess_image(image):
    if not isinstance(image, Image.Image):
        image = Image.open(image).convert("RGB")
    return image


# SUMMARY REMOVAL

def remove_summary_sections(text):
    if not text:
        return text

    text = re.sub(
        r'(?i)summary\s*\d*\s*[:\-]?\s*.*?(?=(summary\s*\d*[:\-]?|impression:|findings:|$))',
        '', text, flags=re.DOTALL
    )

    for p in [r'(?i)summary\s*\d*\s*[:\-]?', r'(?i)summary\s*[:\-]?']:
        text = re.sub(p, '', text)

    return re.sub(r'\s+', ' ', text).strip()


# PRIOR REPORT CLEANER
def clean_prior_report(text):
    if not text:
        return text

    patterns = [
        r'(?i)history:.*?(?=comparison:|findings:|impression:|$)',
        r'(?i)comparison:.*?(?=findings:|impression:|$)',
        r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)',
        r'(?i)technique:.*?(?=findings:|impression:|$)',
        r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+(?:at|@)\s+\d{1,2}:\d{2})?',
        r'(?i)end\s+of\s+(?:impression|report)'
    ]
    for p in patterns:
        text = re.sub(p, '', text, flags=re.DOTALL)

    text = remove_summary_sections(text)
    return re.sub(r'\s+', ' ', text).strip()


# HALLUCINATION REMOVAL
def remove_hallucinated_findings(text):
    if not text:
        return text

    hallucinations = [
        r'demineralization of the teeth',
        r'the teeth.*?(?=[.!?]|$)',
        r'visual osseous structure.*?(?=[.!?]|$)',
        r'diffuse osteopenia of the soft tissues',
        r'osctotic calcifications',
        r'the liver.*?(?=[.!?]|$)',
        r'dental.*?(?=[.!?]|$)',
        r'teeth.*?(?=[.!?]|$)',
        r'sinuses.*?(?=[.!?]|$)',
        r'ventilator pressure.*?(?=[.!?]|$)',
        r'soft tissue nasogastric tube is not visualized'
    ]

    for p in hallucinations:
        text = re.sub(p, '', text, flags=re.IGNORECASE)

    text = re.sub(r'\s+', ' ', text)
    return re.sub(r'\s+\.', '.', text).strip()


# CORRUPTION FIXER

def fix_text_corruption(text):
    if not text:
        return text

    # merge words like "pneumothoraxImpression"
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

    # fix bad spellings
    fixes = {
        'neumothorax': 'pneumothorax',
        'tpatient': 'the patient',
        'vangiagram': 'angiogram',
        'astharaicinjury': 'aortic injury'
    }
    for wrong, correct in fixes.items():
        text = re.sub(wrong, correct, text, flags=re.IGNORECASE)

    # capitalize sentences
    text = re.sub(r'(?:^|[.!?]\s)([a-z])', lambda m: m.group(0).upper(), text)

    # normalize headers
    text = re.sub(r'(?i)findings:', 'FINDINGS:', text)
    text = re.sub(r'(?i)impression:', 'IMPRESSION:', text)

    return re.sub(r'\s+', ' ', text).strip()


# CLEAN GENERATED REPORT 
def clean_generated_report(text):
    if not text:
        return text

    text = fix_text_corruption(text)
    text = remove_summary_sections(text)

    metadata = [
        r'(?i)history:.*?(?=findings:|impression:|$)',
        r'(?i)comparison:.*?(?=findings:|impression:|$)',
        r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)'
    ]
    for p in metadata:
        text = re.sub(p, '', text, flags=re.DOTALL)

    text = remove_hallucinated_findings(text)
    text = re.sub(r'\s+', ' ', text).strip()

    # add missing findings
    if "FINDINGS:" not in text and "IMPRESSION:" in text:
        text = "FINDINGS: No acute abnormality. " + text

    #Convert everything AFTER "IMPRESSION:" to lowercase
    match = re.search(r'(IMPRESSION:\s*)(.*)', text, flags=re.IGNORECASE | re.DOTALL)
    if match:
        header = match.group(1)
        content = match.group(2).lower()
        text = header + content

    return text.strip()


# PHRASE FIXER 

def fix_clinical_phrasing(text):
    if not text:
        return text

    replacements = {
        'has also been removed': 'has improved',
        'removed from this study': 'compared to prior',
        'focused consolidation': 'focal consolidation'
    }
    for k, v in replacements.items():
        text = text.replace(k, v)

    return text
