import os
import json
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.cloud import storage, firestore
from google.oauth2 import service_account
from auth import decode_token
from dotenv import load_dotenv

# Load local .env only for development; Render uses its own environment
load_dotenv()

security = HTTPBearer()

storage_client = None
firestore_client = None
bucket = None

BUCKET_NAME = os.getenv("BUCKET_NAME", "susufdoctor-storage")


def initialize_gcloud():
    """
    Initialize Google Cloud Storage + Firestore using GCP_CREDENTIALS 
    (escaped JSON string stored as an environment variable).
    """
    global storage_client, firestore_client, bucket

    try:
        creds_json = os.getenv("GCP_CREDENTIALS")
        project_id = os.getenv("GCP_PROJECT_ID")

        if not creds_json:
            raise RuntimeError(
                "GCP_CREDENTIALS is missing. Did you set it in Render environment variables?"
            )

        print("Loading Google Cloud service account from environment...")

        # Convert escaped JSON string into real Python dict
        creds_info = json.loads(creds_json)

        # Convert to Google service account credentials
        credentials = service_account.Credentials.from_service_account_info(creds_info)

        # Initialize clients
        storage_client = storage.Client(credentials=credentials, project=project_id)
        firestore_client = firestore.Client(credentials=credentials, project=project_id)

        # Assign bucket
        global bucket
        bucket = storage_client.bucket(BUCKET_NAME)

        print(f"Connected to Google Cloud Project: {storage_client.project}")
        print(f"Using Storage Bucket: {BUCKET_NAME}")
        print(f" Firestore Project: {firestore_client.project}")

    except json.JSONDecodeError as e:
        print(" ERROR: Invalid JSON in GCP_CREDENTIALS:", e)
        raise HTTPException(status_code=500, detail="Invalid GCP credentials JSON")

    except Exception as e:
        print(f"ERROR initializing Google Cloud services: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_firestore():
    """Return Firestore client."""
    if not firestore_client:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    return firestore_client


def get_storage_bucket():
    """Return Google Cloud Storage bucket."""
    if not bucket:
        raise HTTPException(status_code=500, detail="Storage bucket not initialized")
    return bucket


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Verify JWT token from Authorization: Bearer <token>
    """
    try:
        print(f"DEBUG: Credentials object: {credentials}")

        if not credentials:
            raise HTTPException(status_code=401, detail="Authorization header missing")

        token = credentials.credentials
        print(f"DEBUG: Token received (first 20 chars): {token[:20]}...")

        payload = decode_token(token)
        print(f"DEBUG: Decoded payload: {payload}")

        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        print(f" Token valid for user: {user_id}")

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "full_name": payload.get("full_name")
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f" Unexpected token verification error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")
