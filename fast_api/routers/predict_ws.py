import os
import io
import asyncio
from datetime import datetime, timedelta
from PIL import Image
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from routers.predict_routes import get_model
from susufDoctor_model import predict_report

from google.cloud import storage, firestore
from utils.pdf_extract import extract_text_from_pdf

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


router = APIRouter(prefix="/predict", tags=["Prediction WebSocket"])


# ----------------------------------------------------------------------
# PDF CREATION
# ----------------------------------------------------------------------
def create_proper_pdf_bytes(report_text: str, patient_info: dict, is_edited=False) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18,
    )

    styles = getSampleStyleSheet()
    title_style = styles["Heading1"]
    title_style.alignment = 1

    heading_style = styles["Heading2"]
    heading_style.fontSize = 14
    heading_style.leading = 18

    normal_style = styles["Normal"]
    story = []

    # Title
    title = "SuSufDoctor Radiology Report"
    if is_edited:
        title += " (Edited)"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 20))

    # Patient info
    patient_info_text = f"""
<b>Date:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}<br/>
<b>Patient:</b> {patient_info.get('patient_name','Unknown')}<br/>
<b>Radiologist:</b> {patient_info.get('radiologist_name','SuSufDoctor')}<br/>
<b>View Type:</b> {patient_info.get('view_type','Unknown')}<br/>
<b>Age:</b> {patient_info.get('age','')} years<br/>
<b>Sex:</b> {patient_info.get('sex','')}<br/>
<b>BMI:</b> {patient_info.get('bmi','')}
"""
    story.append(Paragraph(patient_info_text, normal_style))
    story.append(Spacer(1, 20))
    story.append(Paragraph("<hr/>", normal_style))
    story.append(Spacer(1, 20))

    # Report body
    for line in report_text.splitlines():
        stripped = line.strip()

        if not stripped:
            story.append(Spacer(1, 6))
            continue

        if stripped.upper() in ["FINDINGS:", "IMPRESSION:", "TECHNIQUE:", "COMPARISON:", "CLINICAL HISTORY:"]:
            story.append(Spacer(1, 14))
            story.append(Paragraph(f"<b><u>{stripped}</u></b>", heading_style))
            story.append(Spacer(1, 10))
            continue

        story.append(Paragraph(stripped, normal_style))
        story.append(Spacer(1, 6))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()



# UTILS

async def to_thread(fn, *args, **kwargs):
    return await asyncio.to_thread(fn, *args, **kwargs)


def chunk_text(text: str, max_chars=60):
    words = text.split()
    chunk, length = [], 0
    for w in words:
        if length + len(w) + 1 > max_chars and chunk:
            yield " ".join(chunk)
            chunk, length = [w], len(w)
        else:
            chunk.append(w)
            length += len(w) + 1
    if chunk:
        yield " ".join(chunk)



# MAIN WEBSOCKET ENDPOINT

@router.websocket("/ws")
async def ws_predict(websocket: WebSocket):
    await websocket.accept()
    try:
        payload = await websocket.receive_json()
        xray_hex = payload.get("xray_hex")
        prior_hex = payload.get("prior_hex")
        patient_info = payload.get("patient_info", {}) or {}

        await websocket.send_json({"stage": "Analyzing X-ray image…", "progress": 5})

        
        # Decode image
        
        try:
            if not xray_hex:
                await websocket.send_json({"error": "No X-ray provided."})
                return await websocket.close()

            image_bytes = bytes.fromhex(xray_hex)
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        except Exception as e:
            await websocket.send_json({"error": f"Failed to decode X-ray: {str(e)}"})
            return await websocket.close()

        await websocket.send_json({"stage": "Extracting features…", "progress": 20})

        
        # Prior report logic
        # Case 1: User uploads PDF manually
        # Case 2: Returning patient → fetch last visit
    
        prior_text = ""

        # Manual PDF upload
        if prior_hex:
            await websocket.send_json({"stage": "Processing uploaded prior report…", "progress": 30})
            try:
                pdf_bytes = bytes.fromhex(prior_hex)
                prior_text = extract_text_from_pdf(pdf_bytes) or ""
            except Exception as e:
                await websocket.send_json({"warning": f"Failed to extract text from prior PDF: {str(e)}"})
                prior_text = ""

        # Returning patient – Firestore fetch
        elif patient_info.get("patient_id"):
            await websocket.send_json({"stage": "Loading previous report from patient record…", "progress": 30})
            try:
                firestore_client = firestore.Client()
                visits_ref = (
                    firestore_client.collection("patients")
                    .document(patient_info["patient_id"])
                    .collection("visits")
                    .order_by("created_at", direction=firestore.Query.DESCENDING)
                    .limit(1)
                )

                visits = visits_ref.stream()
                for v in visits:
                    prior_text = (v.to_dict() or {}).get("report_text", "")
                    break

            except Exception as e:
                await websocket.send_json({"warning": f"Failed to fetch prior visit: {str(e)}"})
                prior_text = ""

        
        # Run inference
        
        await websocket.send_json({"stage": "Generating clinical report…", "progress": 45})

        model_bundle = get_model()
        try:
            result = await to_thread(
                predict_report,
                model_bundle,
                image,
                prior_text=prior_text,
                bmi=patient_info.get("bmi"),
                age=patient_info.get("age"),
                sex=patient_info.get("sex"),
                view_type=patient_info.get("view_type"),
            )
        except Exception as e:
            await websocket.send_json({"error": f"Inference failed: {str(e)}"})
            return await websocket.close()

        report_text = result.get("full_text", "") or ""

        
        # Stream output to UI
        
        await websocket.send_json({"stage": "Streaming report…", "progress": 70})
        for chunk in chunk_text(report_text):
            await websocket.send_json({"partial": chunk})
            await asyncio.sleep(0.05)

        await websocket.send_json({"stage": "Finalizing…", "progress": 90})

        
        # PDF generation
        
        patient_info_min = {
            "patient_name": patient_info.get("patient_name"),
            "radiologist_name": patient_info.get("radiologist_name", "SuSufDoctor"),
            "view_type": patient_info.get("view_type"),
            "age": patient_info.get("age"),
            "sex": patient_info.get("sex"),
            "bmi": patient_info.get("bmi"),
        }

        pdf_bytes = await to_thread(create_proper_pdf_bytes, report_text, patient_info_min)

        
        # Upload PDF to GCS
        
        storage_client = storage.Client()
        firestore_client = firestore.Client()

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_name = (patient_info_min["patient_name"] or "patient").replace("/", "_")
        filename = f"generated_reports/{timestamp}_SuSufDoctor_Report_{safe_name}.pdf"

        BUCKET_NAME = os.getenv("BUCKET_NAME")
        generated_report_url = None

        if BUCKET_NAME:
            try:
                bucket = storage_client.bucket(BUCKET_NAME)
                blob = bucket.blob(filename)
                blob.upload_from_string(pdf_bytes, content_type="application/pdf")
                generated_report_url = blob.generate_signed_url(
                    expiration=timedelta(days=7),
                    method="GET",
                    version="v4",
                )
            except Exception as e:
                await websocket.send_json({"warning": f"Failed to upload PDF: {str(e)}"})

        
        # Save visit
        
        try:
            doc_ref = firestore_client.collection("patients").document()
            saved_id = doc_ref.id
            doc_ref.set({
                "patient_id": saved_id,
                "patient_name": patient_info_min["patient_name"],
                "age": patient_info_min["age"],
                "sex": patient_info_min["sex"],
                "bmi": patient_info_min["bmi"],
                "view_type": patient_info_min["view_type"],
                "created_at": datetime.now().isoformat(),
                "generated_report_url": generated_report_url,
                "report_text": report_text,
                "is_edited": False,
                "analysis_mode": result.get("mode", "inference"),
            })
        except Exception as e:
            await websocket.send_json({"warning": f"Failed to save visit: {str(e)}"})
            saved_id = None

        
        
        
        await websocket.send_json({
            "done": True,
            "progress": 100,
            "stage": "Done.",
            "report": report_text,
            "generated_report_url": generated_report_url,
            "patient_id": saved_id,
        })

    except WebSocketDisconnect:
        print("Client disconnected")

    except Exception as e:
        await websocket.send_json({"error": f"Unexpected error: {str(e)}"})
        await websocket.close()