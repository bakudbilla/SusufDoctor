from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dependencies import initialize_gcloud
from routers import auth_routes, predict_routes

# Initialize FastAPI app
app = FastAPI(
    title="SuSufDoctor API",
    description="Radiology Report Generation System for Radiologists",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Google Cloud on startup
@app.on_event("startup")
async def startup_event():
    initialize_gcloud()

# Include routers
app.include_router(auth_routes.router)
app.include_router(predict_routes.router)

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