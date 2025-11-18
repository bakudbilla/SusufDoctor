from fastapi import HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from PIL import Image
import io

from susufDoctor_model import predict_report
from utils.pdf_utils import create_proper_pdf
from utils.pdf_extract import extract_text_from_pdf
from utils.storage_utils import upload_to_bucket
from utils.view_utils import normalize_view_type

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

    image_bytes = await xray_image.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    prior_text = ""
    if prior_report:
        pdf_bytes = await prior_report.read()
        prior_text = extract_text_from_pdf(pdf_bytes)

    # Call HuggingFace Inference API (no model loading needed)
    result = predict_report(
        image, 
        prior_text=prior_text, 
        bmi=bmi, 
        age=age, 
        sex=sex,
        view_type=view_type
    )

    report_text = result["full_text"]

    patient_info = {
        "patient_name": patient_name,
        "radiologist_name": current_user["full_name"],
        "view_type": normalize_view_type(view_type),
        "age": age,
        "sex": sex,
        "bmi": bmi
    }

    pdf_bytes = create_proper_pdf(report_text, patient_info)
    filename = f"generated_reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}.pdf"

    pdf_url = upload_to_bucket(bucket, pdf_bytes, filename, "application/pdf")

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