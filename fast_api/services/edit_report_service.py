from fastapi import HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime

from utils.pdf_utils import create_proper_pdf
from utils.storage_utils import upload_to_bucket
from utils.view_utils import normalize_view_type

async def handle_edit_mode(
    firestore_id,
    report_text,
    patient_name,
    age,
    sex,
    bmi,
    view_type,
    current_user,
    db,
    bucket
):
    try:
        doc_ref = db.collection("patients").document(firestore_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Patient record not found")

        existing_data = doc.to_dict()

        sex = (sex or existing_data.get("sex")).lower()
        view_type = normalize_view_type(view_type or existing_data.get("view_type"))

        patient_info = {
            "patient_name": patient_name or existing_data["patient_name"],
            "radiologist_name": current_user["full_name"],
            "view_type": view_type,
            "age": age or existing_data["age"],
            "sex": sex,
            "bmi": bmi or existing_data["bmi"]
        }

        pdf_bytes = create_proper_pdf(report_text, patient_info, is_edited=True)

        filename = f"edited_reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}_{patient_info['patient_name']}_Edited.pdf"
        pdf_url = upload_to_bucket(bucket, pdf_bytes, filename, "application/pdf")

        doc_ref.update({
            "report_text": report_text,
            "generated_report_url": pdf_url,
            "is_edited": True,
            "last_edited_by": current_user["full_name"],
            "last_edited_at": datetime.now().isoformat()
        })

        return JSONResponse({
            "status": "success",
            "message": "Report updated successfully",
            "data": {
                "patient_id": firestore_id,
                "generated_report_url": pdf_url,
                "report_text": report_text,
                "is_edit": True
            }
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report update failed: {str(e)}")
