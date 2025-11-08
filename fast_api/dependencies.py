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
    """Initialize Google Cloud clients using either:
       1. GCP_CREDENTIALS_PATH (LOCALHOST)
       2. GCP_CREDENTIALS (RENDER)
    """
    global storage_client, firestore_client, bucket

    credentials = None
    project_id = os.getenv("GCP_PROJECT_ID")

    try:
        # Use file-based credentials on LOCALHOST
        credentials_path = os.getenv("GCP_CREDENTIALS_PATH")
        if credentials_path and os.path.exists(credentials_path):
            print(f"Loading GCP credentials from file: {credentials_path}")
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path
            )
            print("Loaded service account from file (LOCALHOST)")

        #Use JSON string credentials on RENDER
        else:
            creds_json = os.getenv("GCP_CREDENTIALS")
            if creds_json:
                print("Loading GCP credentials from environment variable (RENDER)")
                creds_info = json.loads(creds_json)

                # FIX HERE: Convert escaped newlines to actual newlines
                if "private_key" in creds_info:
                    creds_info["private_key"] = creds_info["private_key"].replace("\\n", "\n")

                credentials = service_account.Credentials.from_service_account_info(
                    creds_info
                )
                print("Loaded service account from JSON env")

        # Initialize GCP clients
        if credentials:
            storage_client = storage.Client(credentials=credentials, project=project_id)
            firestore_client = firestore.Client(credentials=credentials, project=project_id)
        else:
            print("WARNING: No credentials provided, using default ADC")
            storage_client = storage.Client()
            firestore_client = firestore.Client()

        bucket = storage_client.bucket(BUCKET_NAME)

        print(f"Connected to GCP Project: {storage_client.project}")
        print(f"Using Storage Bucket: {BUCKET_NAME}")
        print(f"Firestore Project: {firestore_client.project}")

    except json.JSONDecodeError:
        raise ValueError("GCP_CREDENTIALS env variable is NOT valid JSON")
    except Exception as e:
        print(f"Error initializing GCP: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def get_firestore():
    if not firestore_client:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    return firestore_client


def get_storage_bucket():
    if not bucket:
        raise HTTPException(status_code=500, detail="Bucket not initialized")
    return bucket


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        if not credentials:
            raise HTTPException(status_code=401, detail="No credentials provided")

        token = credentials.credentials
        payload = decode_token(token)

        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "full_name": payload.get("full_name")
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
