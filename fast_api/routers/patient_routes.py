from fastapi import APIRouter, Depends, Body
from fastapi.responses import JSONResponse
from google.cloud import firestore
from collections import defaultdict

from dependencies import verify_token, get_firestore

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("/dashboard")
async def get_dashboard_patients(
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Get first 5 unique patients for dashboard table"""
    try:
        docs = db.collection("patients").order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        patients_dict = {}
        
        for doc in docs:
            data = doc.to_dict()
            patient_id = data.get("patient_id")
            
            if not patient_id:
                continue
            
            # Initialize patient if first visit
            if patient_id not in patients_dict:
                patients_dict[patient_id] = {
                    "id": patient_id,
                    "name": data.get("patient_name", "N/A"),
                    "age": data.get("age"),
                    "sex": data.get("sex"),
                    "bmi": data.get("bmi"),
                    "view_type": data.get("view_type", "Frontal"),
                    "latest_visit": data.get("created_at"),
                    "visit_count": 0
                }
            
            # Update latest_visit if this one is newer
            current_visit = data.get("created_at")
            if current_visit and current_visit > patients_dict[patient_id]["latest_visit"]:
                patients_dict[patient_id]["latest_visit"] = current_visit
            
            # Increment visit count
            patients_dict[patient_id]["visit_count"] += 1
            
            if len(patients_dict) >= 5:
                break
        
        patients = list(patients_dict.values())
        
        return JSONResponse({
            "status": "success",
            "data": patients
        })
    
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@router.get("/")
async def get_all_patients(
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Get all unique patients with accurate visit counts"""
    try:
        docs = db.collection("patients").stream()
        patients_dict = {}
        
        # Group documents by patient_id and aggregate data
        for doc in docs:
            data = doc.to_dict()
            patient_id = data.get("patient_id")
            
            if not patient_id:
                continue
            
            # Initialize patient if first visit
            if patient_id not in patients_dict:
                patients_dict[patient_id] = {
                    "patient_id": patient_id,
                    "patient_name": data.get("patient_name"),
                    "age": data.get("age"),
                    "sex": data.get("sex"),
                    "bmi": data.get("bmi"),
                    "latest_visit": data.get("created_at"),
                    "visit_count": 0
                }
            
            # Update latest_visit if this one is newer
            current_visit = data.get("created_at")
            if current_visit:
                if not patients_dict[patient_id]["latest_visit"] or current_visit > patients_dict[patient_id]["latest_visit"]:
                    patients_dict[patient_id]["latest_visit"] = current_visit
            
            # Increment visit count for each document (each document = 1 visit/scan)
            patients_dict[patient_id]["visit_count"] += 1
        
        patients = list(patients_dict.values())
        
        print(f"Retrieved {len(patients)} unique patients")
        print(f"Patient data: {patients}")
        
        return JSONResponse({
            "status": "success",
            "data": patients
        })
    
    except Exception as e:
        print(f"Error fetching patients: {str(e)}")
        import traceback
        traceback.print_exc()
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Get patient details and visit history"""
    try:
        docs = db.collection("patients").where("patient_id", "==", patient_id).stream()
        visits = []
        patient_info = None
        
        for doc in docs:
            data = doc.to_dict()
            
            if not patient_info:
                patient_info = {
                    "patient_id": data.get("patient_id"),
                    "patient_name": data.get("patient_name"),
                    "age": data.get("age"),
                    "sex": data.get("sex"),
                    "bmi": data.get("bmi"),
                    "visit_count": 0
                }
            
            visits.append({
                "visit_id": doc.id,
                "date": data.get("created_at"),
                "reason": f"{data.get('view_type')} chest X-ray",
                "notes": data.get("report_text", "").split("\n")[0] if data.get("report_text") else "",
                "report_pdf": data.get("generated_report_url"),
                "xray_url": data.get("xray_url")
            })
        
        if not patient_info:
            return JSONResponse({"status": "error", "message": "Patient not found"}, status_code=404)
        
        patient_info["visits"] = sorted(visits, key=lambda x: x["date"], reverse=True)
        patient_info["visit_count"] = len(visits)
        
        print(f"Patient {patient_id} retrieved with {patient_info['visit_count']} visits")
        
        return JSONResponse({
            "status": "success",
            "data": patient_info
        })
    
    except Exception as e:
        print(f"Error fetching patient details: {str(e)}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@router.get("/{patient_id}/visits")
async def get_patient_visits(
    patient_id: str,
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Get all visits for a patient"""
    try:
        docs = db.collection("patients").where("patient_id", "==", patient_id).stream()
        visits = []
        
        for doc in docs:
            data = doc.to_dict()
            visits.append({
                "visit_id": doc.id,
                "date": data.get("created_at"),
                "view_type": data.get("view_type"),
                "findings": "Chest X-ray scan",
                "report_url": data.get("generated_report_url"),
                "xray_url": data.get("xray_url"),
                "radiologist": data.get("radiologist_name")
            })
        
        print(f"Patient {patient_id} has {len(visits)} visits")
        
        return JSONResponse({
            "status": "success",
            "data": {
                "patient_id": patient_id,
                "visits": visits,
                "total_visits": len(visits)
            }
        })
    
    except Exception as e:
        print(f"Error fetching patient visits: {str(e)}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@router.patch("/{firestore_id}")
async def update_report(
    firestore_id: str,
    report_data: dict = Body(...),
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Update report text for a patient visit"""
    try:
        doc_ref = db.collection("patients").document(firestore_id)
        doc_ref.update({
            "report_text": report_data.get("report_text")
        })
        
        return JSONResponse({
            "status": "success",
            "message": "Report updated successfully"
        })
    
    except Exception as e:
        print(f"Error updating report: {str(e)}")
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)