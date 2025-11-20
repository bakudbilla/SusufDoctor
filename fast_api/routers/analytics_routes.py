from fastapi import APIRouter
from google.cloud import firestore
from fastapi.responses import FileResponse
from wordcloud import WordCloud, STOPWORDS
from collections import Counter
import os
from fastapi import APIRouter, Depends
from dependencies import get_firestore

router = APIRouter(prefix="/analytics", tags=["Analytics"])


CUSTOM_STOPS = {
    "the", "left", "is", "are", "was", "were", "and", "to", "of", "no",
    "normal", "noted", "there", "mild", "seen", "on", "with",
    "without", "within", "projection", "heart", "lungs", "lung",
    "chest", "xray", "image", "impression", "findings", "view",
    "patient", "study", "exam", "scan", "xrays", "radiograph",
    "small", "right", "over", "film", "base"
}
STOPWORDS_ALL = STOPWORDS.union(CUSTOM_STOPS)


@router.get("/wordcloud")
async def generate_wordcloud(db = Depends(get_firestore)):
    """Generate a static word cloud image from all patient reports."""
    try:
        docs = db.collection("patients").stream()
        combined_text = [
            data.get("report_text")
            for doc in docs
            if (data := doc.to_dict()) and data.get("report_text")
        ]

        all_text = " ".join(combined_text).strip() or "no reports yet"

        wc = WordCloud(
            width=1600,
            height=800,
            background_color="white",
            stopwords=STOPWORDS_ALL,
            collocations=False
        ).generate(all_text)

        # Save and return the image
        output_path = os.path.join(os.getcwd(), "wordcloud.png")
        wc.to_file(output_path)
        return FileResponse(output_path, media_type="image/png")
    
    except Exception as e:
        print(f"Error in /wordcloud: {e}")
        raise


@router.get("/wordcloudtext")
async def get_wordcloud_text(db = Depends(get_firestore)):
    """Return word frequencies for animated word cloud on frontend."""
    try:
        docs = db.collection("patients").stream()

        # Gather report text data
        combined_text = []
        for doc in docs:
            data = doc.to_dict()
            report = data.get("report_text")
            if report:
                combined_text.append(report)

        all_words = " ".join(combined_text).split()

        freq = Counter(all_words)

        words = [
            {"text": w, "value": c}
            for w, c in freq.items()
            if w.lower() not in STOPWORDS_ALL
        ]

        # Limit to top 150 words for performance
        return {"words": words[:150]}
    
    except Exception as e:
        print(f"Error in /wordcloudtext: {e}")
        raise