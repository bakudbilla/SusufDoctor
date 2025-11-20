import os
import json
import os
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
    2. Render/Production: GCP_CREDENTIALS (JSON string in environment variable)
    3. Fallback: Application Default Credentials (ADC)
    """
    global storage_client, firestore_client, bucket

    credentials = None
    project_id = os.getenv("GCP_PROJECT_ID")

    if not project_id:
        raise ValueError("GCP_PROJECT_ID environment variable is required")

    try:
        credentials_path = os.getenv("GCP_CREDENTIALS_PATH")

        if credentials_path:
            if not os.path.isabs(credentials_path):
                credentials_path = os.path.join(os.getcwd(), credentials_path)

            if os.path.exists(credentials_path):
                print(f"Loading GCP credentials from file: {credentials_path}")
                credentials = service_account.Credentials.from_service_account_file(
                    credentials_path
                )
                print("Service account loaded from file")
            else:
                print(f"Credentials file not found at: {credentials_path}")

        if not credentials:
            creds_json = os.getenv("GCP_CREDENTIALS")
            if creds_json:
                print(" Loading GCP credentials from environment variable")
                try:
                    creds_info = json.loads(creds_json)

                    if "private_key" in creds_info:
                        creds_info["private_key"] = creds_info["private_key"].replace("\\n", "\n")

                    credentials = service_account.Credentials.from_service_account_info(
                        creds_info
                    )
                    print("✓ Service account loaded from JSON string")
                except json.JSONDecodeError as e:
                    print(f"✗ GCP_CREDENTIALS is not valid JSON: {e}")
                    raise ValueError("GCP_CREDENTIALS environment variable contains invalid JSON")

        if credentials:
            storage_client = storage.Client(credentials=credentials, project=project_id)
            firestore_client = firestore.Client(credentials=credentials, project=project_id)
            print(f" Connected to GCP project: {project_id}")
        else:
            print("No explicit credentials found. Attempting to use Application Default Credentials...")
            storage_client = storage.Client(project=project_id)
            firestore_client = firestore.Client(project=project_id)
            print(f" Using Application Default Credentials for project: {project_id}")

        # Initialize bucket
        bucket = storage_client.bucket(BUCKET_NAME)
        print(f"Storage bucket initialized: {BUCKET_NAME}")
        print(f" Firestore database: {firestore_client.project}")
        print("=" * 50)
        print("Google Cloud successfully initialized!")
        print("=" * 50)

    except ValueError as e:
        print(f"✗ Configuration error: {e}")
        raise
    except Exception as e:
        print(f"✗ Error initializing GCP: {type(e).__name__}: {e}")
        raise


def get_firestore():
    """Dependency to get Firestore client."""
    if not firestore_client:
        print("✗ Firestore client not initialized!")
        raise HTTPException(
            status_code=500,
            detail="Database service unavailable. Check GCP credentials."
        )
    return firestore_client


def get_storage_bucket():
    """Dependency to get Cloud Storage bucket."""
    if not bucket:
        print("✗ Storage bucket not initialized!")
        raise HTTPException(
            status_code=500,
            detail="Storage service unavailable. Check GCP credentials."
        )
    return bucket


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and extract user information."""
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
        print(f"Token verification error: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")```