"""Smart Pothole Detection System - FastAPI Backend

Main application entry point.
"""

import os
import sys
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from database.db import init_db
from routes.detection import router as detection_router
from routes.dashboard import router as dashboard_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize database on startup."""
    print("Initializing database...")
    await init_db()
    print("Database initialized.")
    
    # Pre-load model to reduce first-request latency
    try:
        from services.detection_service import get_model
        print("Loading YOLO model...")
        get_model()
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Warning: Could not pre-load model: {e}")
        print("Model will be loaded on first detection request.")
    
    yield
    print("Shutting down...")


app = FastAPI(
    title="Smart Pothole Detection System",
    description="AI-powered pothole detection and road monitoring system using YOLO26",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploads and outputs
BACKEND_DIR = os.path.dirname(__file__)
UPLOADS_DIR = os.path.join(BACKEND_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BACKEND_DIR, "outputs")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

# Include routers
app.include_router(detection_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    model_status = "unknown"
    try:
        from services.detection_service import get_model, MODEL_PATH
        if os.path.exists(MODEL_PATH):
            model = get_model()
            model_status = "loaded"
        else:
            model_status = "model_file_missing"
    except Exception as e:
        model_status = f"error: {str(e)}"
    
    return {
        "status": "healthy",
        "model_status": model_status,
        "version": "1.0.0",
    }


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": f"Internal server error: {str(exc)}",
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
