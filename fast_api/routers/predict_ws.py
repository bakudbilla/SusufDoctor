import json
import os
import io
import asyncio
import httpx
from datetime import datetime, timedelta
from PIL import Image
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from dependencies import get_firestore, get_storage_bucket
from utils.pdf_extract import extract_text_from_pdf

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer


router = APIRouter(prefix="/predict", tags=["Prediction WebSocket"])

# HuggingFace Space URL
HF_SPACE_URL = "https://awinpang-smolvlm500-xray-api.hf.space"
HF_TOKEN = os.getenv("HF_TOKEN")


# PDF CREATION
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

    title = "SuSufDoctor Radiology Report"
    if is_edited:
        title += " (Edited)"
    story.append(Paragraph(title, title_style))
    story.append(Spacer(1, 20))

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
            
            # Verify it's a valid image
            image = Image.open(io.BytesIO(image_bytes))
            image = image.convert("RGB")
            
            # Save to BytesIO for sending
            img_buffer = io.BytesIO()
            image.save(img_buffer, format='JPEG')
            img_buffer.seek(0)

        except Exception as e:
            await websocket.send_json({"error": f"Failed to decode X-ray: {str(e)}"})
            return await websocket.close()

        await websocket.send_json({"stage": "Extracting features…", "progress": 20})

        # Prior report logic - handles both new and returning patients
        prior_text = ""
        prior_source = "none"

        # CASE 1: Explicit prior report upload (optional for new patients, or explicit upload)
        if prior_hex:
            await websocket.send_json({"stage": "Processing uploaded prior report…", "progress": 30})
            try:
                pdf_bytes = bytes.fromhex(prior_hex)
                prior_text = extract_text_from_pdf(pdf_bytes) or ""
                prior_source = "uploaded"
                print(f"[Prior Report] Case 1 - Uploaded prior: {len(prior_text)} chars")
            except Exception as e:
                await websocket.send_json({"warning": f"Failed to extract text from prior PDF: {str(e)}"})
                prior_text = ""
                prior_source = "none"

        # CASE 2: Returning patient - fetch from backend (Firestore)
        elif patient_info.get("patient_id"):
            await websocket.send_json({"stage": "Loading previous report from patient record…", "progress": 30})
            try:
                firestore_client = get_firestore()
                patient_doc = firestore_client.collection("patients").document(patient_info["patient_id"])
                
                # Get the most recent visit for this patient
                visits_ref = (
                    patient_doc.collection("visits")
                    .order_by("created_at", direction="DESCENDING")
                    .limit(1)
                )

                visits = list(visits_ref.stream())
                if visits:
                    visit_data = visits[0].to_dict() or {}
                    prior_text = visit_data.get("report_text", "")
                    prior_source = "firestore"
                    print(f"[Prior Report] Case 2 - Returning patient: {len(prior_text)} chars from Firestore")
                else:
                    print(f"[Prior Report] Case 2 - Returning patient but no previous visits found")
                    prior_source = "none"

            except Exception as e:
                print(f"[Prior Report] Case 2 - Error fetching from Firestore: {str(e)}")
                await websocket.send_json({"warning": f"Failed to fetch prior visit: {str(e)}"})
                prior_text = ""
                prior_source = "none"
        
        # CASE 3: New patient - no prior report (optional, generates single-study report)
        else:
            print(f"[Prior Report] Case 3 - New patient: no prior report provided (single-study mode)")
            prior_source = "none"

        # Call HuggingFace Space for inference
        await websocket.send_json({"stage": "Generating clinical report…", "progress": 45})

        try:
            # Reset buffer position before sending
            img_buffer.seek(0)
            
            # Prepare multipart/form-data payload
            files = {
                'file': ('xray.jpg', img_buffer, 'image/jpeg')
            }
            
            data = {
                'prior_text': prior_text or "",
                'age': str(patient_info.get("age") or "unknown"),
                'sex': str(patient_info.get("sex", "unknown")),
                'bmi': str(patient_info.get("bmi") or "unknown"),
                'view_type': str(patient_info.get("view_type", "unknown")),
            }
            
            print(f"Sending to HF Space: {HF_SPACE_URL}/predict")
            print(f"[Request] Prior source: {prior_source}")
            print(f"[Request] Data fields: age={data['age']}, sex={data['sex']}, bmi={data['bmi']}, view_type={data['view_type']}")
            print(f"[Request] Prior text: {len(prior_text)} chars")
            
            # Prepare headers
            headers = {}
            if HF_TOKEN:
                headers['Authorization'] = f'Bearer {HF_TOKEN}'
            
            # Use httpx for async request with multipart/form-data
            async with httpx.AsyncClient(timeout=300.0) as client:
                response = await client.post(
                    f"{HF_SPACE_URL}/predict",
                    files=files,
                    data=data,
                    headers=headers,
                    follow_redirects=True,
                )
            
            print(f"HF Space response status: {response.status_code}")
            print(f"HF Space response content length: {len(response.content)} bytes")
            
            response.raise_for_status()
            result = response.json()
            
            print(f"Response JSON: {json.dumps(result, indent=2)[:500]}...")
            
            if not result.get("success", False):
                error_msg = result.get("error", "Unknown error from HF Space")
                raise Exception(f"HF Space returned error: {error_msg}")
            
            report_text = result.get("report", "")
            
            if not report_text or len(report_text) < 50:
                raise Exception(f"Invalid report received from HF Space (length: {len(report_text)}). Response: {result}")
            
        except httpx.TimeoutException as e:
            print(f"HF Space request timed out: {str(e)}")
            await websocket.send_json({"error": "Inference timed out. Please try again."})
            return await websocket.close()
            
        except httpx.HTTPError as e:
            print(f"HTTP error: {str(e)}")
            try:
                error_detail = response.text
            except:
                error_detail = "Unable to read response"
            await websocket.send_json({"error": f"HTTP error: {str(e)} - {error_detail}"})
            return await websocket.close()
            
        except Exception as e:
            print(f"Inference error: {str(e)}")
            import traceback
            traceback.print_exc()
            await websocket.send_json({"error": f"Inference failed: {str(e)}"})
            return await websocket.close()

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

        # Use initialized clients from dependencies
        firestore_client = get_firestore()
        bucket = get_storage_bucket()

        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        safe_name = (patient_info_min["patient_name"] or "patient").replace("/", "_")
        filename = f"generated_reports/{timestamp}_SuSufDoctor_Report_{safe_name}.pdf"

        generated_report_url = None

        # Upload PDF to GCS
        try:
            blob = bucket.blob(filename)
            blob.upload_from_string(pdf_bytes, content_type="application/pdf")
            generated_report_url = blob.generate_signed_url(
                expiration=timedelta(days=7),
                method="GET",
                version="v4",
            )
        except Exception as e:
            print(f"PDF upload error: {str(e)}")
            await websocket.send_json({"warning": f"Failed to upload PDF: {str(e)}"})

        # Save visit to Firestore
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
                "analysis_mode": "inference",
            })
        except Exception as e:
            print(f"Firestore save error: {str(e)}")
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
        print(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        await websocket.send_json({"error": f"Unexpected error: {str(e)}"})
        await websocket.close()