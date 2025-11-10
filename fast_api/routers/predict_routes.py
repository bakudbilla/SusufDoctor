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
    view_type = view_type.strip().lower()
    
    # Map common variations to standard values
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
    
    # Return mapped value or capitalize if not found
    return view_mapping.get(view_type, view_type.capitalize())

def create_proper_pdf(report_text: str, patient_info: dict, is_edited: bool = False) -> bytes:
    """Create properly formatted PDF with text wrapping"""
    buffer = io.BytesIO()
    
    # Create the PDF object
    doc = SimpleDocTemplate(buffer, pagesize=letter,
                          rightMargin=72, leftMargin=72,
                          topMargin=72, bottomMargin=18)
    
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = styles["Heading1"]
    title_style.alignment = 1  # Center
    
    header_style = styles["Heading2"]
    normal_style = styles["Normal"]
    
    # Build the story (content)
    story = []
    
    # Title with edit indicator
    title = "SuSufDoctor Radiology Report"
    if is_edited:
        title += " (Edited)"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 20))
    
    # Patient information
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
        patient_info_text += f"<br/><b>Status:</b> <font color='blue'>Edited and Verified</font>"
    
    story.append(Paragraph(patient_info_text, normal_style))
    story.append(Spacer(1, 20))
    
    # Add a line separator
    story.append(Paragraph("<hr/>", normal_style))
    story.append(Spacer(1, 20))
    
    # Report content with proper formatting
    paragraphs = report_text.split('\n\n')
    
    for paragraph in paragraphs:
        if paragraph.strip():
            # Check if this looks like a section header
            if paragraph.strip().endswith(':') or paragraph.strip().startswith('**'):
                # It's a header
                clean_paragraph = paragraph.replace('**', '').strip()
                story.append(Paragraph(f"<b>{clean_paragraph}</b>", header_style))
            else:
                # It's normal text
                story.append(Paragraph(paragraph, normal_style))
            story.append(Spacer(1, 12))
    
    # Add edit timestamp if edited
    if is_edited:
        story.append(Spacer(1, 20))
        story.append(Paragraph("<hr/>", normal_style))
        story.append(Paragraph(f"<i>Report edited and verified on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</i>", normal_style))
    
    # Build the PDF
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
        # Get the existing patient record
        doc_ref = db.collection("patients").document(firestore_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Patient record not found")
        
        existing_data = doc.to_dict()
        
        # Use existing data if not provided in edit
        patient_name = patient_name or existing_data.get("patient_name")
        age = age or existing_data.get("age")
        sex = sex or existing_data.get("sex")
        bmi = bmi or existing_data.get("bmi")
        view_type = view_type or existing_data.get("view_type")
        
        # Validate and normalize gender
        sex = sex.strip().lower()
        valid_genders = ['male', 'female', 'other']
        if sex not in valid_genders:
            raise HTTPException(
                status_code=400,
                detail=f"Gender must be one of: {', '.join(valid_genders)}. Received: '{sex}'"
            )
        
        # Normalize view type
        view_type = normalize_view_type(view_type)
        valid_views = ['PA', 'AP', 'Lateral', 'Frontal', 'Other']
        if view_type not in valid_views:
            view_type = 'Other'

        # Create patient info for PDF
        patient_info = {
            'patient_name': patient_name,
            'radiologist_name': current_user['full_name'],
            'view_type': view_type,
            'age': age,
            'sex': sex,
            'bmi': bmi
        }

        # Generate edited PDF
        pdf_bytes = create_proper_pdf(report_text, patient_info, is_edited=True)

        # Upload edited PDF to GCS
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        edited_filename = f"edited_reports/{timestamp}_{patient_name}_Edited_Report.pdf"
        edited_pdf_url = upload_to_bucket(bucket, pdf_bytes, edited_filename, "application/pdf")

        # Update Firestore document
        update_data = {
            "report_text": report_text,
            "generated_report_url": edited_pdf_url,  # Update main report URL
            "last_edited_at": datetime.now().isoformat(),
            "last_edited_by": current_user["full_name"],
            "last_edited_by_email": current_user["email"],
            "is_edited": True,
            "patient_name": patient_name,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "view_type": view_type,
            "original_report_url": existing_data.get("generated_report_url")  # Keep original
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
    """Handle creating a new report (original logic)"""
    # Validate required fields for new report
    if not xray_image:
        raise HTTPException(status_code=400, detail="X-ray image is required for new reports")
    if not all([bmi, age, sex, view_type, patient_name]):
        raise HTTPException(status_code=400, detail="All patient information is required for new reports")

    # Validate and normalize gender
    sex = sex.strip().lower()
    valid_genders = ['male', 'female', 'other']
    if sex not in valid_genders:
        raise HTTPException(
            status_code=400,
            detail=f"Gender must be one of: {', '.join(valid_genders)}. Received: '{sex}'"
        )
    
    # Normalize view type
    original_view_type = view_type
    view_type = normalize_view_type(view_type)
    valid_views = ['PA', 'AP', 'Lateral', 'Frontal', 'Other']
    
    if view_type not in valid_views:
        print(f"View type '{original_view_type}' normalized to 'Other'")
        view_type = 'Other'

    # Validate image file
    if not xray_image.content_type.startswith('image/'):
        raise HTTPException(
            status_code=400, 
            detail="Uploaded file must be an image (JPEG, PNG, etc.)"
        )

    # Read and validate file size
    image_bytes = await xray_image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=400, 
            detail="Image file too large (max 10MB)"
        )
    
    # Process image
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Extract text from prior report
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

    # Get model (will use cached version from startup if already loaded)
    model_bundle = get_model()
    
    # Generate AI report
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

    # Create patient info for PDF
    patient_info = {
        'patient_name': patient_name,
        'radiologist_name': current_user['full_name'],
        'view_type': view_type,
        'original_view_type': original_view_type,
        'age': age,
        'sex': sex,
        'bmi': bmi
    }

    # Generate proper PDF report with text wrapping
    pdf_bytes = create_proper_pdf(report_text, patient_info, is_edited=False)

    # Upload files to GCS
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    
    xray_filename = f"xrays/{timestamp}_{xray_image.filename}"
    xray_url = upload_to_bucket(bucket, image_bytes, xray_filename, xray_image.content_type)

    report_filename = f"generated_reports/{timestamp}_SuSufDoctor_Report.pdf"
    generated_report_url = upload_to_bucket(bucket, pdf_bytes, report_filename, "application/pdf")

    # Store metadata in Firestore
    doc_ref = db.collection("patients").document()
    doc_ref.set({
        "patient_id": doc_ref.id,
        "patient_name": patient_name,
        "age": age,
        "sex": sex,
        "bmi": bmi,
        "view_type": view_type,
        "original_view_type": original_view_type,  # Store original input
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
        "original_report_url": generated_report_url  # Store original URL
    })

    # Return response
    return JSONResponse({
        "status": "success",
        "message": "Report generated and saved successfully.",
        "data": {
            "patient_id": doc_ref.id,
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
        # This will return cached model if already loaded
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
        # EDIT MODE: Update existing report
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
        
        # NEW REPORT MODE: Original logic with validations
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