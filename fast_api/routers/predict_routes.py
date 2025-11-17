from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
from google.cloud import firestore, storage

from dependencies import verify_token, get_firestore, get_storage_bucket
from susufDoctor_model import load_model
from services.new_report_service import handle_new_report_mode
from services.edit_report_service import handle_edit_mode

router = APIRouter(prefix="/predict", tags=["Prediction"])

def get_model():
    return load_model()

@router.get("/health")
async def health_check():
    try:
        model_bundle = get_model()
        return {
            "status": "healthy",
            "model_loaded": model_bundle is not None,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse({"status": "unhealthy", "error": str(e)}, status_code=500)

@router.post("")
async def predict(
    xray_image: UploadFile = File(None),
    prior_report: UploadFile = File(None),
    bmi: float = Form(None),
    age: int = Form(None),
    sex: str = Form(None),
    view_type: str = Form(None),
    patient_name: str = Form(None),
    report_text: str = Form(None),
    firestore_id: str = Form(None),
    is_edit: bool = Form(False),
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore),
    bucket: storage.Bucket = Depends(get_storage_bucket)
):
    try:
        if is_edit and firestore_id and report_text:
            return await handle_edit_mode(
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
            )

        return await handle_new_report_mode(
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
        )

    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": f"Internal server error: {str(e)}"},
            status_code=500
        )
