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
    """
    Initialize Google Cloud clients.
    Supports:
    1. Localhost: GCP_CREDENTIALS_PATH (path to JSON file)
    2. Render: GCP_CREDENTIALS (JSON string in environment variable)
    """
    global storage_client, firestore_client, bucket

    credentials = None
    project_id = os.getenv("GCP_PROJECT_ID")

    try:
        credentials_path = os.getenv("GCP_CREDENTIALS_PATH")

        # Localhost case: loading JSON file
        if credentials_path and os.path.exists(credentials_path):
            print(f"Loading GCP credentials from file: {credentials_path}")
            credentials = service_account.Credentials.from_service_account_file(
                credentials_path
            )
            print("✓ Loaded service account from file")

        # Render case: JSON string in environment variable
        else:
            creds_json = os.getenv("GCP_CREDENTIALS")
            if creds_json:
                print("Loading GCP credentials from environment variable")

                creds_info = json.loads(creds_json)

                # Replace escaped newlines with real newlines
                if "private_key" in creds_info:
                    creds_info["private_key"] = creds_info["private_key"].replace("\\n", "\n")

                credentials = service_account.Credentials.from_service_account_info(
                    creds_info
                )
                print("✓ Loaded service account from JSON string")
            else:
                print("⚠ WARNING: No GCP_CREDENTIALS_PATH or GCP_CREDENTIALS found!")

        # Initialize cloud clients
        if credentials:
            storage_client = storage.Client(credentials=credentials, project=project_id)
            firestore_client = firestore.Client(credentials=credentials, project=project_id)
            print(f"✓ Connected to Google Cloud project: {storage_client.project}")
        else:
            print("⚠ No credentials provided. Attempting to use default ADC...")
            storage_client = storage.Client()
            firestore_client = firestore.Client()
            print(f"✓ Using default Application Default Credentials")

        bucket = storage_client.bucket(BUCKET_NAME)

        print(f"✓ Storage bucket: {BUCKET_NAME}")
        print(f"✓ Firestore project: {firestore_client.project}")
        print("✓ Google Cloud initialized successfully!")

    except json.JSONDecodeError as e:
        print(f"❌ GCP_CREDENTIALS is not valid JSON: {e}")
        raise ValueError("GCP_CREDENTIALS environment variable is not valid JSON")
    except Exception as e:
        print(f"❌ Error initializing GCP: {e}")
        raise


def get_firestore():
    if not firestore_client:
        print("❌ Firestore not initialized! Check your GCP credentials.")
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    return firestore_client


def get_storage_bucket():
    if not bucket:
        print("❌ Storage bucket not initialized! Check your GCP credentials.")
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