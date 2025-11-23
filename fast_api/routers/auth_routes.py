from fastapi import APIRouter, HTTPException, Depends, Body, File, UploadFile
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from google.cloud import firestore, storage

from models import RadiologistRegister, RadiologistLogin, AdminCreate
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
        
        return {
    "status": "success",
    "access_token": access_token,
    "token_type": "bearer",
    "user": {
        "user_id": user_data["user_id"],
        "email": user_data["email"],
        "full_name": user_data["full_name"],
        "license_number": user_data.get("license_number"),
        "is_active": user_data.get("is_active", True),
        "is_admin": user_data.get("is_admin", False),
        "is_superuser": user_data.get("is_superuser", False)
    }
}

        
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
    """
    Upload user profile picture to GCS with PRIVATE access and generate signed URL
    """
    try:
        print(f"Starting profile picture upload for user: {current_user['user_id']}")
        
        if not profile_picture.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail="File must be an image (JPEG, PNG, etc.)"
            )
        
        file_bytes = await profile_picture.read()
        print(f"File info: {profile_picture.filename}, Size: {len(file_bytes)} bytes, Type: {profile_picture.content_type}")
        
        if len(file_bytes) > 5 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Image file too large (max 5MB)"
            )
        
        # Upload to GCS (PRIVATE - no public access)
        user_id = current_user["user_id"]
        timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
        file_extension = profile_picture.filename.split('.')[-1] if '.' in profile_picture.filename else 'jpg'
        destination_path = f"profile-pictures/{user_id}_{timestamp}.{file_extension}"
        
        print(f"📤 Uploading to GCS (private): {destination_path}")
        
        blob = bucket.blob(destination_path)
        
        # Upload as PRIVATE (no make_public() call)
        blob.upload_from_string(
            file_bytes, 
            content_type=profile_picture.content_type
        )
        
        signed_url = blob.generate_signed_url(
            expiration=timedelta(days=7),
            method="GET"
        )
        
        print(f"🔗 Generated signed URL (expires in 7 days)")
        
        gcs_path = destination_path
        
        user_ref = db.collection("radiologists").document(user_id)
        update_data = {
            "profile_picture_url": signed_url, 
            "profile_picture_gcs_path": gcs_path,  
            "profile_picture_updated_at": datetime.now().isoformat()
        }
        
        user_ref.update(update_data)
        print(f"💾 Saved to Firestore with signed URL")
        
        return JSONResponse({
            "status": "success",
            "message": "Profile picture uploaded successfully",
            "data": {
                "profile_picture_url": signed_url,
                "gcs_path": gcs_path,
                "file_size": len(file_bytes),
                "content_type": profile_picture.content_type,
                "timestamp": timestamp,
                "url_type": "signed_temporary"
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Profile picture upload error: {str(e)}")
        import traceback
        print(f"🔍 Full traceback: {traceback.format_exc()}")
        return JSONResponse(
            {"status": "error", "message": f"Failed to upload profile picture: {str(e)}"},
            status_code=500
        )
        
       
        
@router.post("/create-admin")
async def create_admin(
    admin_data: AdminCreate,
    db: firestore.Client = Depends(get_firestore)
):
    """Create an admin account with detailed error logging"""
    
    print("\n" + "="*80)
    print("🔍 CREATE-ADMIN ENDPOINT CALLED")
    print("="*80)
    
    try:
        # Step 1: Validate input
        print(f"\n✓ Step 1: Received admin data")
        print(f"  - Email: {admin_data.email}")
        print(f"  - Full Name: {admin_data.full_name}")
        print(f"  - Password length: {len(admin_data.password)}")
        
        email = admin_data.email.lower().strip()
        full_name = admin_data.full_name.strip()
        
        print(f"\n✓ Step 2: Normalized data")
        print(f"  - Email: {email}")
        print(f"  - Full Name: {full_name}")
        
        # Step 2: Check Firestore connection
        print(f"\n✓ Step 3: Checking Firestore connection...")
        users_ref = db.collection("radiologists")
        print(f"  - Collection reference: {users_ref}")
        
        # Step 3: Check if email exists
        print(f"\n✓ Step 4: Checking if email exists...")
        try:
            existing_query = users_ref.where("email", "==", email).limit(1).stream()
            existing_list = list(existing_query)
            print(f"  - Query executed successfully")
            print(f"  - Existing records found: {len(existing_list)}")
            
            if len(existing_list) > 0:
                print(f"  ❌ Email already exists!")
                raise HTTPException(
                    status_code=400,
                    detail="Email already registered"
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"  ❌ Query error: {str(e)}")
            print(f"  ❌ Error type: {type(e).__name__}")
            raise Exception(f"Firestore query failed: {str(e)}")
        
        # Step 4: Hash password
        print(f"\n✓ Step 5: Hashing password...")
        try:
            hashed_password = hash_password(admin_data.password)
            print(f"  - Password hashed successfully")
            print(f"  - Hash length: {len(hashed_password)}")
        except Exception as e:
            print(f"  ❌ Password hashing failed: {str(e)}")
            raise Exception(f"Password hashing failed: {str(e)}")
        
        # Step 5: Create document
        print(f"\n✓ Step 6: Creating admin document...")
        try:
            user_doc = users_ref.document()
            print(f"  - Document ID generated: {user_doc.id}")
            
            user_data = {
                "user_id": user_doc.id,
                "email": email,
                "password_hash": hashed_password,
                "full_name": full_name,
                "license_number": "ADMIN-001",
                "created_at": datetime.now().isoformat(),
                "is_active": True,
                "is_admin": True,
                "is_superuser": True,
                "profile_picture_url": None,
                "phone": None,
                "specialization": "Administrator"
            }
            
            print(f"  - Document data prepared")
            print(f"  - Fields: {list(user_data.keys())}")
            
            user_doc.set(user_data)
            print(f"  ✓ Document saved to Firestore")
            
        except Exception as e:
            print(f"  ❌ Document creation failed: {str(e)}")
            print(f"  ❌ Error type: {type(e).__name__}")
            import traceback
            print(traceback.format_exc())
            raise Exception(f"Document creation failed: {str(e)}")
        
        # Success
        print(f"\n{'='*80}")
        print(f"✅ ADMIN ACCOUNT CREATED SUCCESSFULLY")
        print(f"{'='*80}")
        print(f"Email: {email}")
        print(f"Full Name: {full_name}")
        print(f"User ID: {user_doc.id}")
        print(f"Created At: {datetime.now().isoformat()}")
        print(f"{'='*80}\n")
        
        return JSONResponse({
            "status": "success",
            "message": "Admin account created successfully",
            "data": {
                "user_id": user_doc.id,
                "email": email,
                "full_name": full_name
            }
        }, status_code=201)
        
    except HTTPException as he:
        print(f"\n❌ HTTP Exception: {he.detail}")
        raise
    except Exception as e:
        error_msg = str(e)
        print(f"\n{'='*80}")
        print(f"❌ ADMIN CREATION FAILED")
        print(f"{'='*80}")
        print(f"Error: {error_msg}")
        print(f"Error type: {type(e).__name__}")
        print(f"{'='*80}\n")
        
        import traceback
        print("Full traceback:")
        print(traceback.format_exc())
        
        return JSONResponse(
            {
                "status": "error",
                "message": f"Admin creation failed: {error_msg}",
                "error_type": type(e).__name__
            },
            status_code=500
        )

# Debug endpoint to test Firestore connection
@router.get("/debug/firestore-test")
async def test_firestore(db: firestore.Client = Depends(get_firestore)):
    """Test Firestore connection"""
    print("\n🔍 Testing Firestore connection...")
    try:
        # Try to list collections
        collections = list(db.collections())
        print(f"✓ Collections found: {[c.id for c in collections]}")
        
        # Try to access radiologists collection
        radiologists_ref = db.collection("radiologists")
        docs = list(radiologists_ref.limit(1).stream())
        print(f"✓ Radiologists collection accessible, docs found: {len(docs)}")
        
        return {
            "status": "success",
            "message": "Firestore connected successfully",
            "collections": [c.id for c in collections],
            "radiologists_count": len(docs)
        }
    except Exception as e:
        print(f"❌ Firestore error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }

# Debug endpoint to test password hashing
@router.post("/debug/test-hash")
async def test_hash(password: str = Body(...)):
    """Test password hashing"""
    print(f"\n🔍 Testing password hash for: {password}")
    try:
        from auth import hash_password
        hashed = hash_password(password)
        print(f"✓ Password hashed successfully")
        print(f"  Hash length: {len(hashed)}")
        return {
            "status": "success",
            "message": "Password hashed successfully",
            "original_length": len(password),
            "hash_length": len(hashed)
        }
    except Exception as e:
        print(f"❌ Hash error: {str(e)}")
        return {
            "status": "error",
            "message": str(e),
            "error_type": type(e).__name__
        }
        
        
@router.post("/login")
async def login(
    credentials: RadiologistLogin,
    db: firestore.Client = Depends(get_firestore)
):
    """Login and receive JWT token with admin verification"""
    try:
        users_ref = db.collection("radiologists")
        user_query = users_ref.where("email", "==", credentials.email.lower()).limit(1).stream()
        
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
        
        # Create JWT token with role information
        access_token = create_access_token(
            data={
                "sub": user_data["user_id"],
                "email": user_data["email"],
                "full_name": user_data["full_name"],
                "is_admin": user_data.get("is_admin", False),
                "is_superuser": user_data.get("is_superuser", False)
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
                "license_number": user_data.get("license_number"),
                "is_admin": user_data.get("is_admin", False),
                "is_superuser": user_data.get("is_superuser", False)
            }
        })
        
    except HTTPException:
        raise
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )


@router.get("/me/role")
async def get_user_role(
    current_user: dict = Depends(verify_token),
    db: firestore.Client = Depends(get_firestore)
):
    """Get current user's role information"""
    try:
        user_doc = db.collection("radiologists").document(current_user["user_id"]).get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = user_doc.to_dict()
        
        return JSONResponse({
            "status": "success",
            "data": {
                "user_id": current_user.get("user_id"),
                "email": current_user.get("email"),
                "full_name": current_user.get("full_name"),
                "is_admin": user_data.get("is_admin", False),
                "is_superuser": user_data.get("is_superuser", False)
            }
        })
    except Exception as e:
        return JSONResponse(
            {"status": "error", "message": str(e)},
            status_code=500
        )