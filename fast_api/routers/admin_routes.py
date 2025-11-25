import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import JSONResponse
from google.cloud import firestore
from datetime import datetime, timedelta
from dependencies import verify_token, get_firestore

router = APIRouter(prefix="/admin", tags=["Admin"])

# Thread pool for running sync Firestore operations asynchronously
executor = ThreadPoolExecutor(max_workers=10)

async def run_sync_operation(func, *args, **kwargs):
    """Run synchronous Firestore operations in thread pool"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, partial(func, *args, **kwargs))

async def verify_admin(
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Verify user is admin before accessing admin endpoints"""
    user_doc = await run_sync_operation(
        lambda: db.collection("radiologists").document(current_user["user_id"]).get()
    )
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user_data = user_doc.to_dict()
    if not user_data.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/dashboard/stats")
async def get_dashboard_stats(
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    try:
        # Run all queries concurrently
        radiologists_docs, patients_docs = await asyncio.gather(
            run_sync_operation(lambda: list(db.collection("radiologists").stream())),
            run_sync_operation(lambda: list(db.collection("patients").stream()))
        )
        
        total_radiologists = len(radiologists_docs)
        active_radiologists = len([
            doc for doc in radiologists_docs 
            if doc.to_dict().get("is_active") is True
        ])
        total_admins = len([
            doc for doc in radiologists_docs 
            if doc.to_dict().get("is_admin") is True
        ])
        
        patients_set = set(doc.to_dict().get("patient_id") for doc in patients_docs)
        total_patients = len([p for p in patients_set if p])
        total_reports = len(patients_docs)
        
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        reports_this_week = len([
            doc for doc in patients_docs 
            if doc.to_dict().get("created_at", "") >= week_ago
        ])
        
        return JSONResponse({
            "status": "success",
            "data": {
                "total_reports": total_reports,
                "reports_this_week": reports_this_week,
                "total_patients": total_patients,
                "total_radiologists": total_radiologists,
                "active_radiologists": active_radiologists,
                "total_admins": total_admins,
                "timestamp": datetime.now().isoformat()
            }
        })
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )

@router.get("/users")
async def get_all_users(
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    """Get all radiologist users with activity data"""
    try:
        users_docs = await run_sync_operation(
            lambda: list(db.collection("radiologists").stream())
        )
        
        async def get_user_with_reports(user_doc):
            user_data = user_doc.to_dict()
            user_reports = await run_sync_operation(
                lambda: len(list(
                    db.collection("patients")
                    .where("radiologist_id", "==", user_data["user_id"])
                    .stream()
                ))
            )
            return {
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "full_name": user_data["full_name"],
                "license_number": user_data.get("license_number"),
                "is_active": user_data.get("is_active", True),
                "is_admin": user_data.get("is_admin", False),
                "is_superuser": user_data.get("is_superuser", False),
                "created_at": user_data.get("created_at"),
                "report_count": user_reports
            }
        
        # Fetch all users concurrently
        users = await asyncio.gather(*[
            get_user_with_reports(doc) for doc in users_docs
        ])
        
        return JSONResponse({"status": "success", "data": users})
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )

@router.patch("/users/{user_id}")
async def update_user(
    user_id: str,
    update_data: dict = Body(...),
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    """Update user status (activate/deactivate/make admin)"""
    try:
        user_ref = db.collection("radiologists").document(user_id)
        user_doc = await run_sync_operation(lambda: user_ref.get())
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        allowed_fields = ["is_active", "is_admin"]
        safe_update = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not safe_update:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        await run_sync_operation(lambda: user_ref.update(safe_update))
        
        return JSONResponse({
            "status": "success",
            "message": "User updated successfully",
            "data": safe_update
        })
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )

@router.get("/reports/recent")
async def get_recent_reports(
    limit: int = 20,
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    """Get recent reports across all radiologists"""
    try:
        docs = await run_sync_operation(
            lambda: list(
                db.collection("patients")
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(limit)
                .stream()
            )
        )
        
        reports = [
            {
                "report_id": doc.id,
                "patient_id": data.get("patient_id"),
                "patient_name": data.get("patient_name"),
                "radiologist_name": data.get("radiologist_name"),
                "created_at": data.get("created_at"),
                "view_type": data.get("view_type"),
                "is_edited": data.get("is_edited", False)
            }
            for doc in docs
            for data in [doc.to_dict()]
        ]
        
        return JSONResponse({"status": "success", "data": reports})
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )

@router.get("/reports/{report_id}")
async def get_report_detail(
    report_id: str,
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    """Get detailed report by report ID"""
    try:
        doc = await run_sync_operation(
            lambda: db.collection("patients").document(report_id).get()
        )
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Report not found")
        
        data = doc.to_dict()
        return JSONResponse({
            "status": "success",
            "data": {
                "report_id": doc.id,
                "patient_id": data.get("patient_id"),
                "patient_name": data.get("patient_name"),
                "patient_age": data.get("age"),
                "patient_gender": data.get("sex"),
                "radiologist_name": data.get("radiologist_name"),
                "radiologist_id": data.get("radiologist_id"),
                "view_type": data.get("view_type"),
                "findings": data.get("report_text", "") if data.get("report_text") else "",
                "report_pdf": data.get("generated_report_url"),
                "xray_url": data.get("xray_url"),
                "created_at": data.get("created_at"),
                "is_edited": data.get("is_edited", False)
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )

@router.get("/system-health")
async def check_system_health(
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    """Check system health and database status"""
    try:
        await run_sync_operation(
            lambda: db.collection("system").document("health_check").get()
        )
        return JSONResponse({
            "status": "success",
            "data": {
                "database": "healthy",
                "api": "operational",
                "last_check": datetime.now().isoformat()
            }
        })
    except Exception as e:
        return JSONResponse({
            "status": "success",
            "data": {
                "database": "unhealthy",
                "api": "operational",
                "error": str(e),
                "last_check": datetime.now().isoformat()
            }
        })

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(verify_admin),
    db: firestore.Client = Depends(get_firestore)
):
    """Delete a radiologist user (cannot delete superusers)"""
    try:
        user_ref = db.collection("radiologists").document(user_id)
        user_doc = await run_sync_operation(lambda: user_ref.get())
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        
        if user_data.get("is_superuser", False):
            raise HTTPException(status_code=403, detail="Cannot delete superuser accounts")
        
        if user_id == current_user["user_id"]:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        # Fetch and delete all associated reports
        reports = await run_sync_operation(
            lambda: list(
                db.collection("patients")
                .where("radiologist_id", "==", user_id)
                .stream()
            )
        )
        
        # Delete all reports concurrently
        await asyncio.gather(*[
            run_sync_operation(lambda r=report: r.reference.delete())
            for report in reports
        ])
        
        await run_sync_operation(lambda: user_ref.delete())
        
        return JSONResponse({
            "status": "success",
            "message": f"Radiologist {user_data.get('full_name')} deleted successfully",
            "data": {
                "user_id": user_id,
                "email": user_data.get("email"),
                "full_name": user_data.get("full_name")
            }
        })
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )