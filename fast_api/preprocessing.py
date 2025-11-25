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
# SUMMARY REMOVAL (NEW + STRONG)
# -----------------------------------------------------
def remove_summary_sections(text: str) -> str:
    """Aggressively remove all 'summary <number>' sections and stray patterns."""
    if not text:
        return text

    # Remove big summary blocks until next header or next summary
    text = re.sub(
        r'(?i)summary\s*\d*\s*[:\-]?\s*.*?(?=(summary\s*\d*[:\-]?|impression:|findings:|$))',
        '',
        text,
        flags=re.DOTALL
    )

    # Remove leftover stray patterns like "summary 1", "summary:", "summary-4", etc.
    stray_patterns = [
        r'(?i)summary\s*\d*\s*[:\-]?',
        r'(?i)summary\s*[:\-]?',
    ]
    for p in stray_patterns:
        text = re.sub(p, '', text)

    # Clean spacing
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([,.:])', r'\1', text)

    return text.strip()


# -----------------------------------------------------
# PRIOR REPORT CLEANER
# -----------------------------------------------------
def clean_prior_report(text):
    """Clean prior report by removing metadata sections."""
    if not text:
        return text

    text = re.sub(r'(?i)history:.*?(?=comparison:|findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)technique:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+(?:at|@)\s+\d{1,2}:\d{2})?', '', text)
    text = re.sub(r'(?i)end\s+of\s+(?:impression|report)', '', text)

    # REMOVE SUMMARY STUFF
    text = remove_summary_sections(text)

    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# -----------------------------------------------------
# HALLUCINATION REMOVAL
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

    # cleanup
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s+\.', '.', text)

    return text.strip()


# -----------------------------------------------------
# TEXT CORRUPTION FIXER
# -----------------------------------------------------
def fix_text_corruption(text):
    """Fix common text corruption issues in generated reports."""
    if not text:
        return text

    # Fix lowercase+uppercase stuck words
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

    # Add missing spaces in medical terms
    medical_terms = [
        'assessment', 'findings', 'impression', 'limited', 'secondary',
        'evaluation', 'imaging', 'radiograph', 'examination', 'view'
    ]
    for term in medical_terms:
        pattern = rf'({term})([a-z]+)'
        text = re.sub(pattern, rf'\1 \2', text, flags=re.IGNORECASE)

    # Fix specific corrupt words
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

    # Punctuation fixes
    text = re.sub(r'(\.)([a-z])', r'\1 \2', text)
    text = re.sub(r'(,)([a-z])', r'\1 \2', text)

    # Normalize capitalization
    text = re.sub(r'(?:^|[.!?]\s)([a-z])', lambda m: m.group(0).upper(), text)

    # Force headers
    text = re.sub(r'(?i)\bfindings:', 'FINDINGS:', text)
    text = re.sub(r'(?i)\bimpression:', 'IMPRESSION:', text)

    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# -----------------------------------------------------
# CLEAN GENERATED REPORT
# -----------------------------------------------------
def clean_generated_report(text):
    """Clean and normalize generated chest X-ray reports."""
    if not text:
        return text

    # Step 1 — Fix corruption
    text = fix_text_corruption(text)

    # Step 2 — REMOVE ALL SUMMARY BLOCKS
    text = remove_summary_sections(text)

    # Step 3 — Remove LLM gibberish
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

    # Step 4 — Remove metadata
    text = re.sub(r'(?i)history:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)

    # Step 5 — Remove irrelevant hallucinations
    text = remove_hallucinated_findings(text)

    # Step 6 — Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Ensure FINDINGS exists
    if "FINDINGS:" not in text and "IMPRESSION:" in text:
        text = "FINDINGS: No acute abnormality.\n" + text

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
# SUMMARY REMOVAL (NEW + STRONG)
# -----------------------------------------------------
def remove_summary_sections(text: str) -> str:
    """Aggressively remove all 'summary <number>' sections and stray patterns."""
    if not text:
        return text

    # Remove big summary blocks until next header or next summary
    text = re.sub(
        r'(?i)summary\s*\d*\s*[:\-]?\s*.*?(?=(summary\s*\d*[:\-]?|impression:|findings:|$))',
        '',
        text,
        flags=re.DOTALL
    )

    # Remove leftover stray patterns like "summary 1", "summary:", "summary-4", etc.
    stray_patterns = [
        r'(?i)summary\s*\d*\s*[:\-]?',
        r'(?i)summary\s*[:\-]?',
    ]
    for p in stray_patterns:
        text = re.sub(p, '', text)

    # Clean spacing
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\s+([,.:])', r'\1', text)

    return text.strip()


# -----------------------------------------------------
# PRIOR REPORT CLEANER
# -----------------------------------------------------
def clean_prior_report(text):
    """Clean prior report by removing metadata sections."""
    if not text:
        return text

    text = re.sub(r'(?i)history:.*?(?=comparison:|findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)technique:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{2,4}(?:\s+(?:at|@)\s+\d{1,2}:\d{2})?', '', text)
    text = re.sub(r'(?i)end\s+of\s+(?:impression|report)', '', text)

    # REMOVE SUMMARY STUFF
    text = remove_summary_sections(text)

    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# -----------------------------------------------------
# HALLUCINATION REMOVAL
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

    # cleanup
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\.{2,}', '.', text)
    text = re.sub(r'\s+\.', '.', text)

    return text.strip()


# -----------------------------------------------------
# TEXT CORRUPTION FIXER
# -----------------------------------------------------
def fix_text_corruption(text):
    """Fix common text corruption issues in generated reports."""
    if not text:
        return text

    # Fix lowercase+uppercase stuck words
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)

    # Add missing spaces in medical terms
    medical_terms = [
        'assessment', 'findings', 'impression', 'limited', 'secondary',
        'evaluation', 'imaging', 'radiograph', 'examination', 'view'
    ]
    for term in medical_terms:
        pattern = rf'({term})([a-z]+)'
        text = re.sub(pattern, rf'\1 \2', text, flags=re.IGNORECASE)

    # Fix specific corrupt words
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

    # Punctuation fixes
    text = re.sub(r'(\.)([a-z])', r'\1 \2', text)
    text = re.sub(r'(,)([a-z])', r'\1 \2', text)

    # Normalize capitalization
    text = re.sub(r'(?:^|[.!?]\s)([a-z])', lambda m: m.group(0).upper(), text)

    # Force headers
    text = re.sub(r'(?i)\bfindings:', 'FINDINGS:', text)
    text = re.sub(r'(?i)\bimpression:', 'IMPRESSION:', text)

    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# -----------------------------------------------------
# CLEAN GENERATED REPORT
# -----------------------------------------------------
def clean_generated_report(text):
    """Clean and normalize generated chest X-ray reports."""
    if not text:
        return text

    # Step 1 — Fix corruption
    text = fix_text_corruption(text)

    # Step 2 — REMOVE ALL SUMMARY BLOCKS
    text = remove_summary_sections(text)

    # Step 3 — Remove LLM gibberish
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

    # Step 4 — Remove metadata
    text = re.sub(r'(?i)history:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)comparison:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)
    text = re.sub(r'(?i)procedure\s+comments:.*?(?=findings:|impression:|$)', '', text, flags=re.DOTALL)

    # Step 5 — Remove irrelevant hallucinations
    text = remove_hallucinated_findings(text)

    # Step 6 — Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Ensure FINDINGS exists
    if "FINDINGS:" not in text and "IMPRESSION:" in text:
        text = "FINDINGS: No acute abnormality.\n" + text

    # Step 7 — Convert impression section to lowercase
    text = re.sub(
        r'IMPRESSION:\s*(.+?)(?=\s*$)',
        lambda m: 'IMPRESSION: ' + m.group(1).lower(),
        text,
        flags=re.DOTALL
    )

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