from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io
import fitz
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from datetime import datetime, timedelta
from google.cloud import firestore, storage

from dependencies import verify_token, get_firestore, get_storage_bucket, BUCKET_NAME
from susufDoctor_model import load_model, predict_report

router = APIRouter(prefix="/predict", tags=["Prediction"])


def get_model():
    """
    Get the cached model for use in main.py startup and endpoints.
    This function is called by main.py during startup to pre-load the model.
    """
    return load_model()


def upload_to_bucket(bucket: storage.Bucket, file_bytes: bytes, destination_path: str, content_type: str):
    """Upload file to GCS and return signed URL"""
    blob = bucket.blob(destination_path)
    blob.upload_from_string(file_bytes, content_type=content_type)

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


def normalize_view_type(view_type: str) -> str:
    """Normalize various view type inputs to standard format"""
    view_type = (view_type or "").strip().lower()

    view_mapping = {
        'frontal': 'Frontal',
        'frontal view': 'Frontal',
        'front': 'Frontal',
        'pa': 'PA',
        'posteroanterior': 'PA',
        'ap': 'AP',
        'anteroposterior': 'AP',
        'lateral': 'Lateral',
        'lat': 'Lateral',
        'side': 'Lateral',
        'other': 'Other',
        'unknown': 'Other'
    }

    return view_mapping.get(view_type, view_type.capitalize() if view_type else 'Other')


def create_proper_pdf(report_text: str, patient_info: dict, is_edited: bool = False) -> bytes:
    """
    Create properly formatted PDF with:
    - Uppercase section headers
    - Lowercased clinical text (consistent with model output)
    """
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72, leftMargin=72,
        topMargin=72, bottomMargin=18
    )

    styles = getSampleStyleSheet()
    title_style = styles["Heading1"]
    title_style.alignment = 1  # Center
    header_style = styles["Heading2"]
    normal_style = styles["Normal"]

    story = []

    title = "SuSufDoctor Radiology Report"
    if is_edited:
        title += " (Edited)"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 20))

    patient_info_text = f"""
    <b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
    <b>Patient:</b> {patient_info['patient_name']}<br/>
    <b>Radiologist:</b> {patient_info['radiologist_name']}<br/>
    <b>View Type:</b> {patient_info['view_type']}<br/>
    <b>Age:</b> {patient_info['age']} years<br/>
    <b>Sex:</b> {patient_info['sex']}<br/>
    <b>BMI:</b> {patient_info['bmi']}
    """
    if is_edited:
        patient_info_text += f"<br/><b>Status:</b> Edited and Verified"

    story.append(Paragraph(patient_info_text, normal_style))
    story.append(Spacer(1, 20))

    story.append(Paragraph("<hr/>", normal_style))
    story.append(Spacer(1, 20))

    # Consistent PDF layout for lowercase clinical text
    paragraphs = report_text.split("\n\n")

    for paragraph in paragraphs:
        if not paragraph.strip():
            continue

        p = paragraph.strip()

        # Keep section headers uppercase and bold
        if p.endswith(":"):
            story.append(Paragraph(f"<b>{p.upper()}</b>", header_style))
            story.append(Spacer(1, 10))
        else:
            # Lowercase text in PDF body for consistency
            story.append(Paragraph(p.lower(), normal_style))
            story.append(Spacer(1, 8))

    if is_edited:
        story.append(Spacer(1, 20))
        story.append(Paragraph("<hr/>", normal_style))
        story.append(Paragraph(
            f"<i>Report edited and verified on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>",
            normal_style
        ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


async def handle_edit_mode(
    firestore_id: str,
    report_text: str,
    patient_name: str,
    age: str,
    sex: str,
    bmi: str,
    view_type: str,
    current_user: dict,
    db: firestore.Client,
    bucket: storage.Bucket
):
    """Handle editing an existing report"""
    try:
        doc_ref = db.collection("patients").document(firestore_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail="Patient record not found")

        existing_data = doc.to_dict()

        patient_name = patient_name or existing_data.get("patient_name")
        age = age or existing_data.get("age")
        sex = (sex or existing_data.get("sex", "")).strip().lower()
        bmi = bmi or existing_data.get("bmi")
        view_type = view_type or existing_data.get("view_type")

        valid_genders = ['male', 'female', 'other']
        if sex not in valid_genders:
            raise HTTPException(
                status_code=400,
                detail=f"Gender must be one of: {', '.join(valid_genders)}. Received: '{sex}'"
            )

        view_type = normalize_view_type(view_type)
        valid_views = ['PA', 'AP', 'Lateral', 'Frontal', 'Other']
        if view_type not in valid_views:
            view_type = 'Other'

        patient_info = {
            'patient_name': patient_name,
            'radiologist_name': current_user['full_name'],
            'view_type': view_type,
            'age': age,
            'sex': sex,
            'bmi': bmi
        }

        pdf_bytes = create_proper_pdf(report_text, patient_info, is_edited=True)

        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        safe_name = (patient_name or "patient").replace("/", "_").replace("\\", "_")
        edited_filename = f"edited_reports/{timestamp}_{safe_name}_Edited_Report.pdf"
        edited_pdf_url = upload_to_bucket(bucket, pdf_bytes, edited_filename, "application/pdf")

        update_data = {
            "report_text": report_text,
            "generated_report_url": edited_pdf_url,
            "last_edited_at": datetime.now().isoformat(),
            "last_edited_by": current_user["full_name"],
            "last_edited_by_email": current_user["email"],
            "is_edited": True,
            "patient_name": patient_name,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "view_type": view_type,
            "original_report_url": existing_data.get("generated_report_url")
        }

        doc_ref.update(update_data)

        return JSONResponse({
            "status": "success",
            "message": "Report updated successfully",
            "data": {
                "patient_id": firestore_id,
                "patient_name": patient_name,
                "generated_report_url": edited_pdf_url,
                "report_text": report_text,
                "is_edit": True,
                "normalized_view_type": view_type,
                "original_view_type": existing_data.get("original_view_type", view_type)
            }
        })

    except HTTPException:
        raise
    except Exception as e:
        print(f"Edit mode error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Report update failed: {str(e)}")


async def handle_new_report_mode(
    xray_image: UploadFile,
    prior_report: UploadFile,
    bmi: float,
    age: int,
    sex: str,
    view_type: str,
    patient_name: str,
    current_user: dict,
    db: firestore.Client,
    bucket: storage.Bucket
):
    """Handle creating a new report"""
    if not xray_image:
        raise HTTPException(status_code=400, detail="X-ray image is required for new reports")
    if not all([bmi is not None, age is not None, sex, view_type, patient_name]):
        raise HTTPException(status_code=400, detail="All patient information is required for new reports")

    sex = (sex or "").strip().lower()
    valid_genders = ['male', 'female', 'other']
    if sex not in valid_genders:
        raise HTTPException(
            status_code=400,
            detail=f"Gender must be one of: {', '.join(valid_genders)}. Received: '{sex}'"
        )

    original_view_type = view_type
    view_type = normalize_view_type(view_type)
    valid_views = ['PA', 'AP', 'Lateral', 'Frontal', 'Other']
    if view_type not in valid_views:
        view_type = 'Other'

    if not (xray_image.content_type or "").startswith('image/'):
        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image (JPEG, PNG, etc.)"
        )

    image_bytes = await xray_image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Image file too large (max 10MB)"
        )

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    prior_text = ""
    prior_report_url = None
    if prior_report:
        if not prior_report.filename.lower().endswith('.pdf'):
            raise HTTPException(
                status_code=400,
                detail="Prior report must be a PDF file"
            )

        pdf_bytes = await prior_report.read()
        prior_text = extract_text_from_pdf(pdf_bytes)
        prior_filename = f"reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}_{prior_report.filename}"
        prior_report_url = upload_to_bucket(bucket, pdf_bytes, prior_filename, "application/pdf")

    model_bundle = get_model()

    result = predict_report(
        model_bundle,
        image,
        prior_text,
        bmi,
        age,
        sex,
        view_type
    )
    report_text = result["full_text"]

    patient_info = {
        'patient_name': patient_name,
        'radiologist_name': current_user['full_name'],
        'view_type': view_type,
        'original_view_type': original_view_type,
        'age': age,
        'sex': sex,
        'bmi': bmi
    }

    pdf_bytes = create_proper_pdf(report_text, patient_info, is_edited=False)

    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    safe_img_name = xray_image.filename.replace("/", "_").replace("\\", "_")

    xray_filename = f"xrays/{timestamp}_{safe_img_name}"
    xray_url = upload_to_bucket(bucket, image_bytes, xray_filename, xray_image.content_type)

    report_filename = f"generated_reports/{timestamp}_SuSufDoctor_Report.pdf"
    generated_report_url = upload_to_bucket(bucket, pdf_bytes, report_filename, "application/pdf")

    # CHECK IF PATIENT ALREADY EXISTS
    existing_patient_doc = None
    try:
        query = db.collection("patients").where(
            "patient_name", "==", patient_name
        ).where(
            "age", "==", age
        ).where(
            "sex", "==", sex
        ).limit(1).stream()
        
        for doc in query:
            existing_patient_doc = doc
            break
    except Exception as e:
        print(f"Error checking for existing patient: {e}")
    
    if existing_patient_doc:
        # Patient exists - use their existing patient_id and create a new visit document
        patient_id = existing_patient_doc.to_dict().get("patient_id")
        print(f"Found existing patient: {patient_id}")
        
        doc_ref = db.collection("patients").document()
        doc_ref.set({
            "patient_id": patient_id,  # USE EXISTING PATIENT ID
            "patient_name": patient_name,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "view_type": view_type,
            "original_view_type": original_view_type,
            "created_at": datetime.now().isoformat(),
            "radiologist_id": current_user["user_id"],
            "radiologist_name": current_user["full_name"],
            "radiologist_email": current_user["email"],
            "xray_url": xray_url,
            "prior_report_url": prior_report_url,
            "generated_report_url": generated_report_url,
            "report_text": report_text,
            "status": "completed",
            "is_edited": False,
            "original_report_url": generated_report_url
        })
    else:
        # New patient - create new document with new patient_id
        doc_ref = db.collection("patients").document()
        patient_id = doc_ref.id
        print(f"Creating new patient: {patient_id}")
        
        doc_ref.set({
            "patient_id": patient_id,  # NEW PATIENT ID
            "patient_name": patient_name,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "view_type": view_type,
            "original_view_type": original_view_type,
            "created_at": datetime.now().isoformat(),
            "radiologist_id": current_user["user_id"],
            "radiologist_name": current_user["full_name"],
            "radiologist_email": current_user["email"],
            "xray_url": xray_url,
            "prior_report_url": prior_report_url,
            "generated_report_url": generated_report_url,
            "report_text": report_text,
            "status": "completed",
            "is_edited": False,
            "original_report_url": generated_report_url
        })

    return JSONResponse({
        "status": "success",
        "message": "Report generated and saved successfully.",
        "data": {
            "patient_id": patient_id,
            "patient_name": patient_name,
            "xray_url": xray_url,
            "prior_report_url": prior_report_url,
            "generated_report_url": generated_report_url,
            "normalized_view_type": view_type,
            "original_view_type": original_view_type,
            "report_text": report_text,
            "is_edit": False
        }
    })


@router.get("/health")
async def health_check():
    """Check if model is loaded and API is healthy"""
    try:
        model_bundle = get_model()
        return {
            "status": "healthy",
            "model_loaded": model_bundle is not None,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            {"status": "unhealthy", "error": str(e)},
            status_code=500
        )


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
    """Generate or update radiology report from X-ray image"""
    try:
        if is_edit and firestore_id and report_text:
            return await handle_edit_mode(
                firestore_id=firestore_id,
                report_text=report_text,
                patient_name=patient_name,
                age=age,
                sex=sex,
                bmi=bmi,
                view_type=view_type,
                current_user=current_user,
                db=db,
                bucket=bucket
            )

        return await handle_new_report_mode(
            xray_image=xray_image,
            prior_report=prior_report,
            bmi=bmi,
            age=age,
            sex=sex,
            view_type=view_type,
            patient_name=patient_name,
            current_user=current_user,
            db=db,
            bucket=bucket
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse(
            {"status": "error", "message": f"Internal server error: {str(e)}"},
            status_code=500
        )