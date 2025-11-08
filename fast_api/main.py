from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from dependencies import initialize_gcloud
from routers import auth_routes, predict_routes, patient_routes

# Load environment variables first
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="SuSufDoctor API",
    description="Radiology Report Generation System",
    version="1.0.0"
)

# ---------------------------------------------------------
# CORS CONFIGURATION
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://susufdoctor-app.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# SAFE STARTUP
# ---------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print("Starting up SuSufDoctor API...")
    try:
        initialize_gcloud()
        print("Google Cloud initialized successfully")
    except Exception as e:
        # Do not stop the API if GCP initialization fails
        print("Warning: Failed to initialize Google Cloud services:")
        print(str(e))
        print("Continuing without Google Cloud initialization.")

# ---------------------------------------------------------
# ROUTERS
# ---------------------------------------------------------
app.include_router(auth_routes.router)
app.include_router(predict_routes.router)
app.include_router(patient_routes.router)

# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SuSufDoctor API"
    }

# ---------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "Welcome to SuSufDoctor API",
        "docs": "/docs",
        "version": "1.0.0"
    }
