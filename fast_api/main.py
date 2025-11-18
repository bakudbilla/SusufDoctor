from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import asyncio
import threading

from dependencies import initialize_gcloud
from routers import auth_routes, predict_routes, patient_routes, analytics_routes, predict_ws


# Load environment variables first
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="SuSufDoctor API",
    description="Radiology Report Generation System for Radiologists",
    version="1.0.0",
)

# CORS configuration
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
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# ROOT ENDPOINT
@app.get("/")
async def root():
    return {
        "message": "Welcome to SuSufDoctor API",
        "docs": "/docs",
        "version": "1.0.0"
    }

# HEALTH CHECK ENDPOINT
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SuSufDoctor API"
    }


def initialize_background():
    """Initialize heavy tasks in background to avoid blocking startup"""
    try:
        print("Initializing Google Cloud in background...")
        initialize_gcloud()
        print("✓ Google Cloud initialized successfully")
    except Exception as e:
        print(f"⚠ Google Cloud init warning: {e}")
    
    try:
        print("Pre-loading ML model in background...")
        from routers.predict_routes import get_model
        model = get_model()
        print("✓ ML model loaded and cached successfully")
    except Exception as e:
        print(f"⚠ Model pre-load warning: {e}")


@app.on_event("startup")
async def startup_event():
    print("Starting up SuSufDoctor API...")
    print(f"Allowed Origins: {origins}")
    
    # Run heavy initialization in background thread to avoid blocking
    # This allows the app to start listening on port 8080 immediately
    thread = threading.Thread(target=initialize_background, daemon=True)
    thread.start()


# Register Routers
app.include_router(auth_routes.router, tags=["Authentication"])
app.include_router(predict_routes.router, tags=["Predictions"])
app.include_router(predict_ws.router, tags=["Prediction WebSocket"]) 
app.include_router(patient_routes.router, tags=["Patients"])
app.include_router(analytics_routes.router, tags=["Analytics"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)