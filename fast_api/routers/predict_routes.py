from fastapi import APIRouter, File, UploadFile, Form, Depends
from fastapi.responses import JSONResponse
from PIL import Image
import io
import fitz
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime, timedelta
from google.cloud import firestore, storage

from dependencies import verify_token, get_firestore, get_storage_bucket, BUCKET_NAME
from susufDoctor_model import load_model, predict_report

router = APIRouter(prefix="/predict", tags=["Prediction"])

# Load model once
model_bundle = load_model()


def upload_to_bucket(bucket: storage.Bucket, file_bytes: bytes, destination_path: str, content_type: str):
    """Upload file to GCS and return signed URL"""
    blob = bucket.blob(destination_path)
    blob.upload_from_string(file_bytes, content_type=content_type)
    
    # Generate signed URL that expires in 7 days
    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(days=7),
        method="GET"
    )
    return signed_url


def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF"""
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text")
    return text.strip()


@router.post("/")
async def predict(
    xray_image: UploadFile = File(...),
    prior_report: UploadFile = File(None),
    bmi: float = Form(...),
    age: int = Form(...),
    sex: str = Form(...),
    view_type: str = Form(...),
    patient_name: str = Form(...),
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore),
    bucket: storage.Bucket = Depends(get_storage_bucket)
):
    """Generate radiology report from X-ray image"""
    try:
        # 1. Read X-ray image
        image_bytes = await xray_image.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # 2. Extract text from prior report
        prior_text = ""
        prior_report_url = None
        if prior_report:
            pdf_bytes = await prior_report.read()
            prior_text = extract_text_from_pdf(pdf_bytes)
            prior_filename = f"reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}_{prior_report.filename}"
            prior_report_url = upload_to_bucket(bucket, pdf_bytes, prior_filename, "application/pdf")

        # 3. Generate AI report
        result = predict_report(model_bundle, image, prior_text, bmi, age, sex, view_type)
        report_text = result["full_text"]

        # 4. Generate PDF report
        buffer = io.BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setTitle("SuSufDoctor Radiology Report")

        pdf.setFont("Helvetica-Bold", 14)
        pdf.drawString(200, 760, "SuSufDoctor Radiology Report")

        pdf.setFont("Helvetica", 10)
        pdf.drawString(50, 740, f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        pdf.drawString(50, 725, f"Patient: {patient_name}")
        pdf.drawString(50, 710, f"Radiologist: {current_user['full_name']}")
        pdf.line(50, 705, 550, 705)

        y = 690
        for line in report_text.split("\n"):
            pdf.drawString(50, y, line.strip())
            y -= 14
            if y < 50:
                pdf.showPage()
                pdf.setFont("Helvetica", 10)
                y = 740

        pdf.save()
        buffer.seek(0)
        pdf_bytes = buffer.getvalue()

        # 5. Upload files to GCS
        xray_filename = f"xrays/{datetime.now().strftime('%Y%m%d-%H%M%S')}_{xray_image.filename}"
        xray_url = upload_to_bucket(bucket, image_bytes, xray_filename, xray_image.content_type)

        report_filename = f"generated_reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}_SuSufDoctor_Report.pdf"
        generated_report_url = upload_to_bucket(bucket, pdf_bytes, report_filename, "application/pdf")

        # 6. Store metadata in Firestore
        doc_ref = db.collection("patients").document()
        doc_ref.set({
            "patient_id": doc_ref.id,
            "patient_name": patient_name,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "view_type": view_type,
            "created_at": datetime.now().isoformat(),
            "radiologist_id": current_user["user_id"],
            "radiologist_name": current_user["full_name"],
            "xray_url": xray_url,
            "prior_report_url": prior_report_url,
            "generated_report_url": generated_report_url,
        })

        # 7. Return response
        return JSONResponse({
            "status": "success",
            "message": "Report generated and saved successfully.",
            "data": {
                "firestore_id": doc_ref.id,
                "xray_url": xray_url,
                "prior_report_url": prior_report_url,
                "generated_report_url": generated_report_url
            }
        })

    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)