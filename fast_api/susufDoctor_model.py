# susufDoctor_model.py
import os
import re
import time
import torch
from difflib import SequenceMatcher
from typing import List, Dict, Tuple
from transformers import Idefics3ForConditionalGeneration, AutoProcessor
from dotenv import load_dotenv

# Import preprocessing utilities
from preprocessing import (
    clean_prior_report,
    clean_generated_report,
    fix_clinical_phrasing,
    remove_hallucinated_findings,
    fix_text_corruption,
)

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
MODEL_ID = os.getenv("MODEL_NAME")

_MODEL_CACHE = None
_LOADING_LOCK = False

system_message = "You are an expert radiologist specialized in interpreting chest X-rays."


# Load model
def load_model(token=HF_TOKEN):
    global _MODEL_CACHE, _LOADING_LOCK
    if _MODEL_CACHE is not None:
        return _MODEL_CACHE
    if _LOADING_LOCK:
        while _LOADING_LOCK:
            time.sleep(0.1)
        return _MODEL_CACHE

    try:
        _LOADING_LOCK = True
        model = Idefics3ForConditionalGeneration.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.bfloat32,
            device_map="auto",
            token=token
             
        )
        model.eval()

        processor_obj = AutoProcessor.from_pretrained(
    MODEL_ID,
    use_fast=False,
    trust_remote_code=True,
    token=token
)
        _MODEL_CACHE = (processor_obj, model)
        return _MODEL_CACHE
    finally:
        _LOADING_LOCK = False


# Utility Functions
def remove_hallucinated_metadata(text: str) -> str:
    """Strong cleaner: removes timestamps, dates, repeated headers, '1st view...' artifacts."""
    if not text:
        return text

    text = re.sub(r"\|?\s*<?assistant>?\s*\|?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<\/?assistant.*?>", "", text, flags=re.IGNORECASE)

    text = re.sub(
        r"(?i)(?:first|1st)\s+view(?:\s+of\s+the\s+chest)?(?:\s+was\s+obtained.*?(?:a\.?m\.?|p\.?m\.?|$))?",
        "",
        text
    )

    # Timestamps / dates
    text = re.sub(r"\b\d{1,2}:\d{2}(?:\s?(?:AM|PM|am|pm))?\b", "", text)
    text = re.sub(r"\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b", "", text)
    text = re.sub(
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?\b",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # Remove repeated headers
    text = re.sub(r"(?i)(FINDINGS:\s*)+", "FINDINGS: ", text)
    text = re.sub(r"(?i)(IMPRESSION:\s*)+", "IMPRESSION: ", text)

    # Remove common meta fragments
    meta_patterns = [
        r"report (was )?generated.*",
        r"this report.*",
        r"the images for this examination.*",
        r"transcribed above.*",
        r"the above report.*",
        r"generated at.*",
        r"created at.*",
        r"signed electronically.*",
        r"verified by.*",
        r"dictated by.*",
        r"approved by.*",
    ]
    for p in meta_patterns:
        text = re.sub(p, "", text, flags=re.IGNORECASE)

    # Remove anatomy hallucinations
    text = re.sub(r"(?i)\b(humerus|teeth|liver|sinus|sinuses)\b.*?(?=[\.\n]|$)", "", text)

    # Final cleanup
    text = re.sub(r"\s+", " ", text).strip()
    text = re.sub(r"\s+\.", ".", text)

    return text


def split_into_sentences(text: str) -> List[str]:
    if not text:
        return []
    s = re.sub(r"\s+", " ", text).strip()
    parts = re.split(r"(?<=[\.!?])\s+", s)
    return [p.strip().rstrip(".") for p in parts if p.strip()]


def normalize_sentence(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9\s]", "", s)
    return re.sub(r"\s+", " ", s).strip()


def sentence_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


# Prior diff analysis
def prior_diff_analysis(prior_findings: str, current_findings: str, threshold: float = 0.70):
    prior_sents = split_into_sentences(prior_findings)
    current_sents = split_into_sentences(current_findings)

    prior_norm = [normalize_sentence(s) for s in prior_sents]
    current_norm = [normalize_sentence(s) for s in current_sents]

    matched_prior = [False] * len(prior_norm)
    matched_current = [False] * len(current_norm)

    new, resolved, stable = [], [], []

    for i, cur in enumerate(current_norm):
        best_sim = 0
        best_j = None
        for j, pr in enumerate(prior_norm):
            sim = sentence_similarity(cur, pr)
            if sim > best_sim:
                best_sim = sim
                best_j = j
        if best_sim >= threshold:
            stable.append(current_sents[i])
            matched_current[i] = True
            matched_prior[best_j] = True
        else:
            new.append(current_sents[i])

    for j, m in enumerate(matched_prior):
        if not m:
            resolved.append(prior_sents[j])

    return {"new": new, "resolved": resolved, "stable": stable, "all_findings": current_sents}


# Structure enforcement
def enforce_report_structure(text: str):
    if not text:
        return "No significant acute findings.", "No significant interval change."

    text = re.sub(r"(?i)findings\s*:", "FINDINGS:", text)
    text = re.sub(r"(?i)impression\s*:", "IMPRESSION:", text)

    m = re.search(r"IMPRESSION\s*:", text)
    if m:
        findings = text[:m.start()].replace("FINDINGS:", "").strip()
        impression = text[m.end():].strip()
        return findings, impression

    sents = split_into_sentences(text)
    split = max(1, len(sents) // 2)
    return ". ".join(sents[:split]), ". ".join(sents[split:])


def format_structured_report(findings: str, impression: str):
    return f"FINDINGS:\n{findings}\n\nIMPRESSION:\n{impression}"


# Comparison language enhancer
def enhance_comparison_language(text: str):
    if not text:
        return text

    replacements = {
        r"is (still|again) seen": "is unchanged",
        r"looks (the same|similar)": "unchanged",
        r"has (increased|grown|worsened)": "interval increase in",
        r"has (decreased|improved|resolved)": "interval decrease in",
        r"not seen (before|previously|on prior)": "new",
        r"no longer (seen|visible|present)": "resolved",
        r"is present": "is identified",
    }
    for p, rpl in replacements.items():
        text = re.sub(p, rpl, text, flags=re.IGNORECASE)

    return text


# Main prediction
def predict_report(
    model_bundle,
    image,
    prior_text="",
    bmi="unknown",
    age="unknown",
    sex="unknown",
    view_type="unknown",
    max_new_tokens=420,
    min_new_tokens=140,
    num_beams=4,
    torch_seed=42,
):

    processor_obj, model = model_bundle
    device = model.device

    torch.manual_seed(torch_seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(torch_seed)

    t0 = time.time()

    # clean prior findings (ONLY findings)
    prior_clean = clean_prior_report(prior_text)
    prior_clean = re.sub(r"(?i).*?FINDINGS:", "", prior_clean)
    prior_clean = re.sub(r"(?i)IMPRESSION:.*", "", prior_clean).strip()

    # No “comparison is made”
    # Instead: generate new labeled findings based on differences
    user_prompt = f"""
Generate a detailed chest X-ray report using automatic interval labels (new, resolved, unchanged, interval increase, interval decrease).

Prior findings for comparison (do not copy, only use to determine interval change):
{prior_clean if prior_clean else "No prior study available"}

CRITICAL RULES:
- Do NOT include phrases like "comparison is made to the prior study".
- Describe each finding using interval labels.
- DO NOT produce timestamps, dates, or acquisition details.
- STRUCTURE OUTPUT AS:

FINDINGS:
<list of labeled findings>

IMPRESSION:
<concise summary>
""".strip()

    messages = [
        {"role": "system", "content": [{"type": "text", "text": system_message}]},
        {"role": "user", "content": [{"type": "image"}, {"type": "text", "text": user_prompt}]},
    ]

    prompt_base = processor_obj.apply_chat_template(messages, add_generation_prompt=False, tokenize=False)
    assistant_start = "\nFINDINGS:\n"
    full_prompt_text = prompt_base + assistant_start

    inputs = processor_obj(text=full_prompt_text, images=[image], return_tensors="pt").to(device)
    prefix_len = processor_obj(text=prompt_base, images=[image], return_tensors="pt")["input_ids"].shape[1]

    badwords = ["summary", "sumary", "humerus", "teeth", "liver", "sinus"]
    bad_ids = []
    for b in badwords:
        try:
            tid = processor_obj.tokenizer.convert_tokens_to_ids(b)
            bad_ids.append([tid] if isinstance(tid, int) else tid)
        except:
            pass

    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            min_new_tokens=min_new_tokens,
            num_beams=num_beams,
            do_sample=False,
            no_repeat_ngram_size=4,
            repetition_penalty=1.2,
            early_stopping=True,
            bad_words_ids=bad_ids if bad_ids else None,
            pad_token_id=processor_obj.tokenizer.eos_token_id,
            eos_token_id=processor_obj.tokenizer.eos_token_id,
        )

    gen_tokens = out[0, prefix_len:]
    raw = processor_obj.decode(gen_tokens, skip_special_tokens=True).strip()

    raw = remove_hallucinated_metadata(raw)
    raw = clean_generated_report(raw)
    raw = fix_clinical_phrasing(raw)
    raw = enhance_comparison_language(raw)

    findings, impression = enforce_report_structure(raw)

    changes = prior_diff_analysis(prior_clean, findings)

    full_report = format_structured_report(findings, impression)
    t1 = time.time()

    return {
        "raw": raw,
        "findings": findings,
        "impression": impression,
        "full_text": full_report,
        "changes": changes,
        "generation_time": t1 - t0,
        "mode": "longitudinal_auto_labeling",
    }
