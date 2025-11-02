from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.cloud import storage, firestore
from auth import decode_token

# Security
security = HTTPBearer()

# Google Cloud clients (will be initialized in main.py)
storage_client = None
firestore_client = None
bucket = None
BUCKET_NAME = "susufdoctor-storage"


def initialize_gcloud():
    """Initialize Google Cloud clients"""
    global storage_client, firestore_client, bucket
    
    try:
        storage_client = storage.Client()
        firestore_client = firestore.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        
        print(f"✓ Connected to Google Cloud Project: {storage_client.project}")
        print(f"✓ Connected to Storage Bucket: {BUCKET_NAME}")
        print(f"✓ Connected to Firestore Database: {firestore_client.project}")
    except Exception as e:
        print(f"✗ Error connecting to Google Cloud services: {e}")
        raise


def get_firestore():
    """Dependency to get Firestore client"""
    return firestore_client


def get_storage_bucket():
    """Dependency to get GCS bucket"""
    return bucket


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user data"""
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "full_name": payload.get("full_name")
    }