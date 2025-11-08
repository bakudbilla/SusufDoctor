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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[  "http://localhost:5173",
        "https://susufdoctor-app.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    print("Starting up SuSufDoctor API...")
    initialize_gcloud()
    print("Google Cloud initialized")

# Include routers
app.include_router(auth_routes.router)
app.include_router(predict_routes.router)
app.include_router(patient_routes.router)

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SuSufDoctor API"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to SuSufDoctor API",
        "docs": "/docs",
        "version": "1.0.0"
    }