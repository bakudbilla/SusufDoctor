from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
import io
import fitz  # PyMuPDF for PDF text extraction
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

# Google Cloud imports
from google.cloud import storage, firestore

from susufDoctor_model import load_model, predict_report

# Initialize FastAPI app
app = FastAPI(title="SuSufDoctor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Adjust when deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------
# Google Cloud setup
# ---------------------------------------------------------------------
try:
    storage_client = storage.Client()
    firestore_client = firestore.Client()
    BUCKET_NAME = "susufdoctor-storage"  # Replace with your actual bucket name
    bucket = storage_client.bucket(BUCKET_NAME)

    # Connection test
    print(f"Connected to Google Cloud Project: {storage_client.project}")
    print(f"Connected to Storage Bucket: {BUCKET_NAME}")
    print(f"Connected to Firestore Database: {firestore_client.project}")

except Exception as e:
    print("Error connecting to Google Cloud services:", e)


def upload_to_bucket(file_bytes: bytes, destination_path: str, content_type: str):
    """Uploads a file to Google Cloud Storage and returns its GCS path."""
    blob = bucket.blob(destination_path)
    blob.upload_from_string(file_bytes, content_type=content_type)

    # Don't make it public; Uniform Bucket-Level Access is enabled
    # Return a direct GCS URL (not publicly accessible unless signed or via IAM)
    return f"https://storage.googleapis.com/{BUCKET_NAME}/{destination_path}"


# ---------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------
model_bundle = load_model()


# ---------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------
def extract_text_from_pdf(pdf_bytes):
    text = ""
    with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
        for page in doc:
            text += page.get_text("text")
    return text.strip()


# ---------------------------------------------------------------------
# Main prediction route
# ---------------------------------------------------------------------
@app.post("/predict/")
async def predict(
    xray_image: UploadFile = File(...),
    prior_report: UploadFile = File(None),
    bmi: float = Form(...),
    age: int = Form(...),
    sex: str = Form(...),
    view_type: str = Form(...),
):
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
            prior_report_url = upload_to_bucket(pdf_bytes, prior_filename, "application/pdf")

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
        pdf.drawString(50, 740, f"Date Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        pdf.line(50, 735, 550, 735)

        y = 720
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
        xray_url = upload_to_bucket(image_bytes, xray_filename, xray_image.content_type)

        report_filename = f"generated_reports/{datetime.now().strftime('%Y%m%d-%H%M%S')}_SuSufDoctor_Report.pdf"
        generated_report_url = upload_to_bucket(pdf_bytes, report_filename, "application/pdf")

        # 6. Store metadata in Firestore
        doc_ref = firestore_client.collection("patients").document()
        doc_ref.set({
            "patient_id": doc_ref.id,
            "age": age,
            "sex": sex,
            "bmi": bmi,
            "view_type": view_type,
            "created_at": datetime.now().isoformat(),
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
