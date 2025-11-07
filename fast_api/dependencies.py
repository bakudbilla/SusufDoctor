import os
import json
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.cloud import storage, firestore
from google.oauth2 import service_account
from auth import decode_token
from dotenv import load_dotenv

load_dotenv()

security = HTTPBearer()

storage_client = None
firestore_client = None
bucket = None

BUCKET_NAME = os.getenv("BUCKET_NAME", "susufdoctor-storage")


def initialize_gcloud():
    """Initialize Google Cloud clients using credentials from file or environment"""
    global storage_client, firestore_client, bucket

    try:
        credentials_path = os.getenv("GCP_CREDENTIALS_PATH")
        creds_json = os.getenv("GCP_CREDENTIALS")
        project_id = os.getenv("GCP_PROJECT_ID")

        credentials = None

        if credentials_path and os.path.exists(credentials_path):
            print(f"Loading GCP credentials from file: {credentials_path}")
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            print("Service account credentials loaded from file")
        
        elif creds_json:
            print("Loading GCP credentials from environment variable...")
            creds_info = json.loads(creds_json)
            credentials = service_account.Credentials.from_service_account_info(creds_info)
            print("Service account credentials loaded from environment")
        
        else:
            print("No credentials found, using default application credentials...")
            credentials = None

        if credentials:
            storage_client = storage.Client(credentials=credentials, project=project_id)
            firestore_client = firestore.Client(credentials=credentials, project=project_id)
        else:
            storage_client = storage.Client()
            firestore_client = firestore.Client()

        bucket = storage_client.bucket(BUCKET_NAME)
        print(f"Connected to Google Cloud Project: {storage_client.project}")
        print(f"Using Storage Bucket: {BUCKET_NAME}")
        print(f"Firestore Project: {firestore_client.project}")

    except FileNotFoundError as e:
        print(f"Credentials file not found: {e}")
        raise
    except json.JSONDecodeError as e:
        print(f"JSON decode error in GCP_CREDENTIALS: {e}")
        raise ValueError("GCP_CREDENTIALS is not valid JSON")
    except Exception as e:
        print(f"Error connecting to Google Cloud services: {e}")
        raise


def get_firestore():
    """Dependency to get Firestore client"""
    if not firestore_client:
        raise HTTPException(
            status_code=500,
            detail="Firestore not initialized"
        )
    return firestore_client


def get_storage_bucket():
    """Dependency to get GCS bucket"""
    if not bucket:
        raise HTTPException(
            status_code=500,
            detail="Storage bucket not initialized"
        )
    return bucket


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user data"""
    try:
        print(f"DEBUG: Credentials object: {credentials}")
        print(f"DEBUG: Credentials type: {type(credentials)}")
        
        if not credentials:
            print("DEBUG: No credentials provided")
            raise HTTPException(status_code=401, detail="No credentials provided")
        
        token = credentials.credentials
        print(f"DEBUG: Token received (first 20 chars): {token[:20] if token else 'None'}...")
        
        payload = decode_token(token)
        print(f"DEBUG: Decoded payload: {payload}")

        if payload is None:
            print("DEBUG: Payload is None - token decode failed")
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        if user_id is None:
            print("DEBUG: user_id not in payload")
            raise HTTPException(status_code=401, detail="Invalid token payload")

        print(f"DEBUG: Token verified for user: {user_id}")
        
        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "full_name": payload.get("full_name")
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Unexpected error in verify_token: {e}")
        raise HTTPException(status_code=401, detail=str(e))