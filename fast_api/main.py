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
    description="Radiology Report Generation System for Radiologists",
    version="1.0.0"
)

# ---------------------------------------------------------
# FIXED CORS CONFIGURATION (Syntax corrected)
# ---------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://susuf-doctor.vercel.app",
        "https://susuf-doctor-git-main-awinpangs-projects.vercel.app", 
        "https://susuf-doctor-5t7ex342u-awinpangs-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000"
    ],  # Added missing commas between origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# EXPLICIT OPTIONS HANDLER FOR CORS PREFLIGHT
# ---------------------------------------------------------
@app.options("/{path:path}")
async def options_handler(path: str):
    return {"message": "CORS preflight approved"}

# ---------------------------------------------------------
# SAFE STARTUP INITIALIZATION
# ---------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print("Starting up SuSufDoctor API...")
    try:
        initialize_gcloud()
        print("Google Cloud initialized")
    except Exception as e:
        print(f"Google Cloud init warning: {e}")

# ---------------------------------------------------------
# ALL ROUTERS MAINTAINED
# ---------------------------------------------------------
app.include_router(auth_routes.router)
app.include_router(predict_routes.router)
app.include_router(patient_routes.router)

# ---------------------------------------------------------
# HEALTH CHECK ENDPOINT
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



