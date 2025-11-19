from fastapi import HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from PIL import Image
import io
import base64
import requests

from utils.pdf_utils import create_proper_pdf
from utils.pdf_extract import extract_text_from_pdf
from utils.storage_utils import upload_to_bucket
from utils.view_utils import normalize_view_type

# HuggingFace Space URL
HF_SPACE_URL = "https://awinpang-smolvlm500-xray-api.hf.space"


async def handle_new_report_mode(
    xray_image,
    prior_report,
    bmi,
    age,
    sex,
    view_type,
    patient_name,
    current_user,
    db,
    bucket
):
    if not xray_image:
        raise HTTPException(400, "X-ray image is required")

    # Read and encode image
    image_bytes = await xray_image.read()
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # Extract prior report if provided
    prior_text = ""
    if prior_report:
        pdf_bytes = await prior_report.read()
        prior_text = extract_text_from_pdf(pdf_bytes)

    # Call HuggingFace Space for inference
    try:
        response = requests.post(
            f"{HF_SPACE_URL}/predict",
            json={
                "image_base64": image_b64,
                "prior_text": prior_text,
                "age": age,
                "sex": sex,
                "bmi": bmi,
                "view_type": view_type,
            },
            timeout=300
        )
        response.raise_for_status()
        result = response.json()
        
        if "error" in result:
            raise HTTPException(500, result["error"])
        
        report_text = result.get("report", "")
        
    except Exception as e:
        raise HTTPException(500, f"Inference failed: {str(e)}")

    # Create patient info for PDF
    patient_info = {
        "patient_name": patient_name,
        "radiologist_name": current_user["full_name"],
        "view_type": normalize_view_type(view_type),
        "age": age,
        "sex": sex,
        "bmi": bmi
    }

    # Generate and upload PDF
    pdf_bytes = create_proper_pdf(report_text, patient_info)
    filename = f"generated_reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"
    pdf_url = upload_to_bucket(bucket, pdf_bytes, filename, "application/pdf")

    # Save to Firestore
    doc_ref = db.collection("patients").document()
    doc_ref.set({
        "patient_id": doc_ref.id,
        "patient_name": patient_name,
        "generated_report_url": pdf_url,
        "report_text": report_text,
        "created_at": datetime.now().isoformat(),
        "is_edited": False
    })

    return JSONResponse({
        "status": "success",
        "message": "Report generated successfully",
        "data": {
            "patient_id": doc_ref.id,
            "generated_report_url": pdf_url,
            "report_text": report_text
        }
    })