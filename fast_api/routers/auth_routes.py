from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from datetime import datetime
from google.cloud import firestore

from models import RadiologistRegister, RadiologistLogin
from auth import hash_password, verify_password, create_access_token
from dependencies import get_firestore, verify_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
async def register(
    radiologist: RadiologistRegister,
    db: firestore.Client = Depends(get_firestore)
):
    """Register a new radiologist"""
    try:
        users_ref = db.collection("radiologists")
        
        # Check if email exists
        existing = users_ref.where("email", "==", radiologist.email).limit(1).get()
        if len(list(existing)) > 0:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Hash password and create user
        hashed_password = hash_password(radiologist.password)
        
        user_doc = users_ref.document()
        user_doc.set({
            "user_id": user_doc.id,
            "email": radiologist.email,
            "password_hash": hashed_password,
            "full_name": radiologist.full_name,
            "license_number": radiologist.license_number,
            "created_at": datetime.now().isoformat(),
            "is_active": True
        })
        
        return JSONResponse({
            "status": "success",
            "message": "Radiologist registered successfully",
            "user_id": user_doc.id
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )


@router.post("/login")
async def login(
    credentials: RadiologistLogin,
    db: firestore.Client = Depends(get_firestore)
):
    """Login and receive JWT token"""
    try:
        users_ref = db.collection("radiologists")
        user_query = users_ref.where("email", "==", credentials.email).limit(1).get()
        
        users_list = list(user_query)
        if len(users_list) == 0:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        user_doc = users_list[0]
        user_data = user_doc.to_dict()
        
        # Verify password
        if not verify_password(credentials.password, user_data["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if account is active
        if not user_data.get("is_active", True):
            raise HTTPException(status_code=401, detail="Account is disabled")
        
        # Create JWT token
        access_token = create_access_token(
            data={
                "sub": user_data["user_id"],
                "email": user_data["email"],
                "full_name": user_data["full_name"]
            }
        )
        
        return JSONResponse({
            "status": "success",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user_data["user_id"],
                "email": user_data["email"],
                "full_name": user_data["full_name"],
                "license_number": user_data.get("license_number")
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )


@router.get("/me")
async def get_current_user(
    current_user: dict = Depends(verify_token)
):
    """Get current authenticated user info"""
    try:
        return JSONResponse({
            "status": "success",
            "data": {
                "user_id": current_user.get("user_id"),
                "email": current_user.get("email"),
                "full_name": current_user.get("full_name")
            }
        })
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )


@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Get current radiologist's profile"""
    try:
        user_doc = db.collection("radiologists").document(current_user["user_id"]).get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        user_data.pop("password_hash", None)
        
        return JSONResponse({"status": "success", "user": user_data})
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )