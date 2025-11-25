import re
from transformers import AutoProcessor
from PIL import Image

processor = AutoProcessor.from_pretrained("Awinpang/smolvlm500-finetuned-xray")


# -----------------------------------------------------
# IMAGE PREPROCESSING
# -----------------------------------------------------
def preprocess_image(image):
    """Convert to PIL Image if needed"""
    if not isinstance(image, Image.Image):
        image = Image.open(image).convert("RGB")
    return image


# -----------------------------------------------------
# REMOVE SUMMARY SECTIONS
# -----------------------------------------------------
def remove_summary_sections(text: str) -> str:
    """Aggressively remove all 'summary <number>' sections and stray patterns."""
    if not text:
        return text

    text = re.sub(
        r'(?i)summary\s*\d*\s*[:\-]?\s*.*?(?=(summary\s*\d*[:\-]?|impression[:]?|findings[:]?|$))',
        '',
        text,
        flags=re.DOTALL
    )

    stray_patterns = [
        r'(?i)summary\s*\d*\s*[:\-]?',
        r'(?i)summary\s*[:\-]?',
    ]
    for p in stray_patterns:
        text = re.sub(p, '', text)

    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([,.:])', r'\1', text)
    return text.strip()


# -----------------------------------------------------
# REMOVE DUPLICATE FINDINGS HEADER
# -----------------------------------------------------
def remove_duplicate_findings_header(text):
    """Remove repeated or duplicated FINDINGS headers."""
    if not text:
        return text

    # FINDINGS:FINDINGS:
    text = re.sub(r'(?i)FINDINGS:\s*FINDINGS:\s*', 'FINDINGS: ', text)

    # FINDINGS: on two lines
    text = re.sub(r'(?i)(FINDINGS:\s*)(\s*FINDINGS:\s*)', r'\1', text)

    return text.strip()


# -----------------------------------------------------
# CLEAN PRIOR REPORT
# -----------------------------------------------------
def clean_prior_report(text):
    """Clean prior report by removing metadata sections."""
    if not text:
        return text

    text = re.sub(r'(?i)history:.*?(?=comparison[:]?|findings[:]?|impression[:]?|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings[:]?|impression[:]?|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings[:]?|impression[:]?|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)technique:.*?(?=findings[:]?|impression[:]?|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+(?:at|@)\s+\d{1,2}:\d{2})?', '', text)
    text = re.sub(r'(?i)end\s+of\s+(?:impression|report)', '', text)

    text = remove_summary_sections(text)

    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# -----------------------------------------------------
# REMOVE HALLUCINATED FINDINGS
# -----------------------------------------------------
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
        r"the patient's airway",
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

    return text.strip()


# -----------------------------------------------------
# FIX CORRUPT TEXT
# -----------------------------------------------------
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
        text = re.sub(rf'({term})([a-z]+)', rf'\1 \2', text, flags=re.IGNORECASE)

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

    text = re.sub(r'(?i)\bfindings\s*:?', 'FINDINGS:', text)
    text = re.sub(r'(?i)\bimpression\s*:?', 'IMPRESSION:', text)

    return text.strip()


# -----------------------------------------------------
# NORMALIZE IMPRESSION (MULTILINE SAFE)
# -----------------------------------------------------
def normalize_impression_case(text):
    """Convert only the IMPRESSION section content to lowercase (multiline)."""
    if not text:
        return text

    pattern = r'(IMPRESSION:\s*)([\s\S]*)'
    match = re.search(pattern, text, flags=re.IGNORECASE)

    if not match:
        return text

    header = match.group(1)
    content = match.group(2).strip().lower()

    return f"{header}{content}"


# -----------------------------------------------------
# CLEAN GENERATED REPORT
# -----------------------------------------------------
def clean_generated_report(text):
    """Clean and normalize generated chest X-ray reports."""
    if not text:
        return text

    text = fix_text_corruption(text)

    # NEW: Remove duplicated FINDINGS headers
    text = remove_duplicate_findings_header(text)

    text = remove_summary_sections(text)

    gibberish_patterns = [
        r"if you have additional findings.*",
        r"would you like to suggest a name.*",
        r"this is the output i am getting.*",
        r"this section.*?(?=[.!?]|$)",
        r"note that this is automatically generated.*",
        r"based on the context of the study.*",
    ]
    for pattern in gibberish_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    text = re.sub(r'\s+', ' ', text).strip()
    text = remove_hallucinated_findings(text)

    if "FINDINGS:" not in text and "IMPRESSION:" in text:
        text = "FINDINGS: No acute abnormality. " + text

    # Normalize IMPRESSION to lowercase
    text = normalize_impression_case(text)

    return text.strip()


# -----------------------------------------------------
# FIX CLINICAL PHRASES
# -----------------------------------------------------
def fix_clinical_phrasing(text):
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
