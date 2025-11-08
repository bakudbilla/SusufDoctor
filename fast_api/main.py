from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
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
# CORS CONFIGURATION - MUST BE FIRST MIDDLEWARE
# ---------------------------------------------------------
origins = [
    "https://susuf-doctor.vercel.app",
    "https://susuf-doctor-git-main-awinpangs-projects.vercel.app", 
    "https://susuf-doctor-5t7ex342u-awinpangs-projects.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=3600,
)

# ---------------------------------------------------------
# EXPLICIT OPTIONS HANDLER FOR CORS PREFLIGHT
# ---------------------------------------------------------
@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle CORS preflight requests"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }
    )

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
# SAFE STARTUP INITIALIZATION
# ---------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    print("🚀 Starting up SuSufDoctor API...")
    print(f"✅ Allowed Origins: {origins}")
    try:
        initialize_gcloud()
        print("✅ Google Cloud initialized successfully")
    except Exception as e:
        print(f"⚠ Google Cloud init warning: {e}")

# ---------------------------------------------------------
# INCLUDE ALL ROUTERS
# ---------------------------------------------------------
app.include_router(auth_routes.router, tags=["Authentication"])
app.include_router(predict_routes.router, tags=["Predictions"])
app.include_router(patient_routes.router, tags=["Patients"])

# ---------------------------------------------------------
# ERROR HANDLER FOR DEBUGGING
# ---------------------------------------------------------
@app.middleware("http")
async def add_cors_header(request, call_next):
    """Additional middleware to ensure CORS headers are present"""
    response = await call_next(request)
    origin = request.headers.get("origin")
    
    if origin in origins or origin is None:
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response