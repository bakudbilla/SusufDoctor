from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from google.cloud import firestore, storage

from models import RadiologistRegister, RadiologistLogin
from auth import hash_password, verify_password, create_access_token
from dependencies import get_firestore, verify_token, get_storage_bucket, BUCKET_NAME

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


@router.post("/logout")
async def logout(
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Logout current user and invalidate token"""
    try:
        user_id = current_user.get("user_id")
        
        # Add token to blacklist collection (optional - for token invalidation)
        blacklist_ref = db.collection("token_blacklist").document()
        blacklist_ref.set({
            "user_id": user_id,
            "logout_time": datetime.now().isoformat(),
            "email": current_user.get("email")
        })
        
        return JSONResponse({
            "status": "success",
            "message": "Logged out successfully"
        })
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


@router.patch("/profile")
async def update_profile(
    profile_data: dict = Body(...),
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Update radiologist's profile information"""
    try:
        user_id = current_user["user_id"]
        user_ref = db.collection("radiologists").document(user_id)
        
        # Fields that can be updated
        allowed_fields = ["full_name", "phone", "license_number", "specialization", "profile_picture_url"]
        update_data = {k: v for k, v in profile_data.items() if k in allowed_fields}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        user_ref.update(update_data)
        
        return JSONResponse({
            "status": "success",
            "message": "Profile updated successfully",
            "data": update_data
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )


@router.post("/upload-profile-picture")
async def upload_profile_picture(
    profile_picture: UploadFile = File(...),
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore),
    bucket: storage.Bucket = Depends(get_storage_bucket)
):
    """Upload user profile picture to GCS and save URL to Firestore"""
    try:
        # Validate file type
        if not profile_picture.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        # Read file bytes
        file_bytes = await profile_picture.read()
        
        # Validate file size (5MB limit)
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image file too large (max 5MB)"
            )
        
        # Upload to GCS
        user_id = current_user["user_id"]
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        file_extension = profile_picture.filename.split('.')[-1] if '.' in profile_picture.filename else 'jpg'
        destination_path = f"profile-pictures/{user_id}_{timestamp}.{file_extension}"
        
        blob = bucket.blob(destination_path)
        blob.upload_from_string(file_bytes, content_type=profile_picture.content_type)
        
        # Generate signed URL (valid for 7 days - max allowed by GCS)
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(days=365),
            method="GET"
        )
        
        # Save URL to Firestore
        user_ref = db.collection("radiologists").document(user_id)
        user_ref.update({
            "profile_picture_url": signed_url,
            "profile_picture_updated_at": datetime.now().isoformat()
        })
        
        return JSONResponse({
            "status": "success",
            "message": "Profile picture uploaded successfully",
            "data": {
                "profile_picture_url": signed_url
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile picture upload error: {str(e)}")
        return JSONResponse(
            {"status": "error", "message": f"Failed to upload profile picture: {str(e)}"},
            status_code=500
        )