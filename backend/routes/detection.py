"""Detection routes for the pothole detection API."""

import os
import csv
import io
import shutil
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse

from services.detection_service import detect_image, detect_video, UPLOADS_DIR, OUTPUTS_DIR
from database.db import (
    save_detection, save_detections_batch, get_all_detections, 
    get_detection_by_id, delete_detection, get_detections_for_export
)

router = APIRouter()

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/bmp", "image/webp", "image/tiff"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/avi", "video/x-msvideo", "video/quicktime", 
                       "video/x-matroska", "video/webm"}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB


@router.post("/detect/image")
async def detect_image_endpoint(
    file: UploadFile = File(...),
    confidence: float = Form(0.25),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
):
    """Upload and analyze an image for pothole detection."""
    # Validate file type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )
    
    # Validate confidence
    if not 0.0 < confidence <= 1.0:
        raise HTTPException(status_code=400, detail="Confidence must be between 0 and 1")
    
    # Save uploaded file
    file_ext = os.path.splitext(file.filename)[1] or ".jpg"
    upload_filename = f"{uuid.uuid4().hex[:12]}{file_ext}"
    upload_path = os.path.join(UPLOADS_DIR, upload_filename)
    
    try:
        with open(upload_path, "wb") as f:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large. Maximum 500MB.")
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Run detection
    try:
        result = detect_image(
            upload_path, 
            confidence_threshold=confidence,
            latitude=latitude,
            longitude=longitude
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")
    
    # Save to database
    db_records = result.get("db_records", [])
    if db_records:
        ids = await save_detections_batch(db_records)
        result["detection_ids"] = ids
    else:
        # Even if no potholes found, save a record
        record = {
            "timestamp": datetime.now().isoformat(),
            "latitude": latitude,
            "longitude": longitude,
            "severity": "none",
            "confidence": 0.0,
            "source_filename": result["source_filename"],
            "source_type": "image",
            "output_filename": result["output_filename"],
            "image_width": result["image_width"],
            "image_height": result["image_height"],
            "pothole_count": 0,
        }
        det_id = await save_detection(record)
        result["detection_ids"] = [det_id]
    
    # Remove internal fields
    result.pop("db_records", None)
    result.pop("output_path", None)
    
    return {
        "success": True,
        "message": f"Detected {result['pothole_count']} pothole(s)",
        "data": result,
    }


@router.post("/detect/video")
async def detect_video_endpoint(
    file: UploadFile = File(...),
    confidence: float = Form(0.25),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
):
    """Upload and analyze a video for pothole detection."""
    # Validate file type
    content_type = file.content_type or ""
    # Be lenient with video types since browsers may report differently
    if content_type and content_type not in ALLOWED_VIDEO_TYPES and not content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Please upload a video file."
        )
    
    # Save uploaded file
    file_ext = os.path.splitext(file.filename)[1] or ".mp4"
    upload_filename = f"{uuid.uuid4().hex[:12]}{file_ext}"
    upload_path = os.path.join(UPLOADS_DIR, upload_filename)
    
    try:
        with open(upload_path, "wb") as f:
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail="File too large. Maximum 500MB.")
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Run detection
    try:
        result = detect_video(
            upload_path,
            confidence_threshold=confidence,
            latitude=latitude,
            longitude=longitude
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video detection failed: {str(e)}")
    
    # Save to database
    db_records = result.get("db_records", [])
    if db_records:
        ids = await save_detections_batch(db_records)
        result["detection_ids"] = ids
    
    # Remove internal fields
    result.pop("db_records", None)
    result.pop("output_path", None)
    
    return {
        "success": True,
        "message": f"Video processed: {result['pothole_count']} pothole detection(s) across {result['frames_processed']} frames",
        "data": result,
    }


@router.get("/detections")
async def get_detections(
    severity: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    """Get all detection records with optional filters."""
    detections = await get_all_detections(
        severity=severity,
        start_date=start_date,
        end_date=end_date,
        limit=limit,
        offset=offset
    )
    return {"success": True, "data": detections, "count": len(detections)}


@router.get("/detections/export")
async def export_detections(
    severity: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
):
    """Export detections as CSV."""
    detections = await get_detections_for_export(
        severity=severity,
        start_date=start_date,
        end_date=end_date
    )
    
    if not detections:
        raise HTTPException(status_code=404, detail="No detections to export")
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=detections[0].keys())
    writer.writeheader()
    writer.writerows(detections)
    
    csv_content = output.getvalue()
    output.close()
    
    filename = f"pothole_detections_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/detections/{detection_id}")
async def get_detection(detection_id: int):
    """Get a single detection by ID."""
    detection = await get_detection_by_id(detection_id)
    if not detection:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"success": True, "data": detection}


@router.delete("/detections/{detection_id}")
async def remove_detection(detection_id: int):
    """Delete a detection record."""
    deleted = await delete_detection(detection_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Detection not found")
    return {"success": True, "message": "Detection deleted"}
