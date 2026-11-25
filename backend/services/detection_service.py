"""Detection service - handles YOLO model loading and inference."""

import os
import cv2
import uuid
import numpy as np
from datetime import datetime
from ultralytics import YOLO

from services.severity_service import estimate_severity, get_severity_color
from services.gps_service import parse_gps_from_exif, validate_coordinates

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "best.pt")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

# Ensure directories exist
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

# Global model instance
_model = None


def get_model():
    """Load and cache the YOLO model."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model weights not found at {MODEL_PATH}. "
                "Please download the model first."
            )
        _model = YOLO(MODEL_PATH)
    return _model


def detect_image(image_path: str, confidence_threshold: float = 0.25,
                 latitude: float = None, longitude: float = None) -> dict:
    """
    Run pothole detection on a single image.
    
    Args:
        image_path: Path to the input image
        confidence_threshold: Minimum confidence threshold
        latitude: Optional GPS latitude
        longitude: Optional GPS longitude
    
    Returns:
        Dictionary with detection results
    """
    model = get_model()
    
    # Read image
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    img_height, img_width = img.shape[:2]
    
    # Try to extract GPS from EXIF if not provided
    if latitude is None or longitude is None:
        gps_data = parse_gps_from_exif(image_path)
        if latitude is None:
            latitude = gps_data.get("latitude")
        if longitude is None:
            longitude = gps_data.get("longitude")
    
    # Validate coordinates
    if latitude is not None and longitude is not None:
        if not validate_coordinates(latitude, longitude):
            latitude = None
            longitude = None
    
    # Run inference
    results = model.predict(
        source=img,
        conf=confidence_threshold,
        verbose=False
    )
    
    detections = []
    annotated_img = img.copy()
    
    for result in results:
        boxes = result.boxes
        if boxes is not None and len(boxes) > 0:
            for box in boxes:
                # Extract box coordinates
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy())
                cls = int(box.cls[0].cpu().numpy())
                
                bbox_width = x2 - x1
                bbox_height = y2 - y1
                
                # Estimate severity
                severity = estimate_severity(bbox_width, bbox_height, img_width, img_height)
                
                # Get severity color for annotation
                color = get_severity_color(severity)
                
                # Draw bounding box
                cv2.rectangle(annotated_img, 
                             (int(x1), int(y1)), (int(x2), int(y2)), 
                             color, 2)
                
                # Draw label
                label = f"Pothole {conf:.2f} [{severity.upper()}]"
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(annotated_img,
                             (int(x1), int(y1) - label_size[1] - 10),
                             (int(x1) + label_size[0], int(y1)),
                             color, -1)
                cv2.putText(annotated_img, label,
                           (int(x1), int(y1) - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                
                detections.append({
                    "bbox_x1": float(x1),
                    "bbox_y1": float(y1),
                    "bbox_x2": float(x2),
                    "bbox_y2": float(y2),
                    "confidence": conf,
                    "severity": severity,
                    "class_id": cls,
                })
    
    # Add pothole count to image
    count_text = f"Potholes Detected: {len(detections)}"
    cv2.putText(annotated_img, count_text,
               (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
    
    # Save annotated image
    output_filename = f"detected_{uuid.uuid4().hex[:8]}_{os.path.basename(image_path)}"
    output_path = os.path.join(OUTPUTS_DIR, output_filename)
    cv2.imwrite(output_path, annotated_img)
    
    # Prepare database records
    source_filename = os.path.basename(image_path)
    timestamp = datetime.now().isoformat()
    
    db_records = []
    for det in detections:
        db_records.append({
            "timestamp": timestamp,
            "latitude": latitude,
            "longitude": longitude,
            "severity": det["severity"],
            "confidence": det["confidence"],
            "bbox_x1": det["bbox_x1"],
            "bbox_y1": det["bbox_y1"],
            "bbox_x2": det["bbox_x2"],
            "bbox_y2": det["bbox_y2"],
            "source_filename": source_filename,
            "source_type": "image",
            "output_filename": output_filename,
            "image_width": img_width,
            "image_height": img_height,
            "pothole_count": len(detections),
        })
    
    return {
        "pothole_count": len(detections),
        "detections": detections,
        "output_filename": output_filename,
        "output_path": output_path,
        "image_width": img_width,
        "image_height": img_height,
        "latitude": latitude,
        "longitude": longitude,
        "db_records": db_records,
        "source_filename": source_filename,
    }


def detect_video(video_path: str, confidence_threshold: float = 0.25,
                 latitude: float = None, longitude: float = None) -> dict:
    """
    Run pothole detection on a video file.
    
    Args:
        video_path: Path to the input video
        confidence_threshold: Minimum confidence threshold
        latitude: Optional GPS latitude
        longitude: Optional GPS longitude
    
    Returns:
        Dictionary with detection results
    """
    model = get_model()
    
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Could not open video: {video_path}")
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Validate coordinates
    if latitude is not None and longitude is not None:
        if not validate_coordinates(latitude, longitude):
            latitude = None
            longitude = None
    
    # Output video
    output_filename = f"detected_{uuid.uuid4().hex[:8]}_{os.path.basename(video_path)}"
    # Always output as .mp4 for web compatibility
    if not output_filename.lower().endswith('.mp4'):
        output_filename = os.path.splitext(output_filename)[0] + '.mp4'
    output_path = os.path.join(OUTPUTS_DIR, output_filename)
    
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    all_detections = []
    frame_count = 0
    total_potholes = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        frame_count += 1
        
        # Process every frame (or skip frames for performance)
        results = model.predict(
            source=frame,
            conf=confidence_threshold,
            verbose=False
        )
        
        frame_detections = 0
        
        for result in results:
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0].cpu().numpy())
                    
                    bbox_width = x2 - x1
                    bbox_height = y2 - y1
                    severity = estimate_severity(bbox_width, bbox_height, width, height)
                    color = get_severity_color(severity)
                    
                    cv2.rectangle(frame, 
                                 (int(x1), int(y1)), (int(x2), int(y2)),
                                 color, 2)
                    
                    label = f"Pothole {conf:.2f} [{severity.upper()}]"
                    label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                    cv2.rectangle(frame,
                                 (int(x1), int(y1) - label_size[1] - 10),
                                 (int(x1) + label_size[0], int(y1)),
                                 color, -1)
                    cv2.putText(frame, label,
                               (int(x1), int(y1) - 5),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                    
                    frame_detections += 1
                    
                    all_detections.append({
                        "frame": frame_count,
                        "bbox_x1": float(x1),
                        "bbox_y1": float(y1),
                        "bbox_x2": float(x2),
                        "bbox_y2": float(y2),
                        "confidence": conf,
                        "severity": severity,
                    })
        
        total_potholes += frame_detections
        
        # Add frame info overlay
        info_text = f"Frame: {frame_count}/{total_frames} | Potholes: {frame_detections} | Total: {total_potholes}"
        cv2.putText(frame, info_text,
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        out.write(frame)
    
    cap.release()
    out.release()
    
    # Aggregate results for DB
    source_filename = os.path.basename(video_path)
    timestamp = datetime.now().isoformat()
    
    # For video, store a summary detection record
    # Group by unique detections (using frame-level aggregation)
    severity_counts = {"low": 0, "medium": 0, "high": 0, "unknown": 0}
    total_confidence = 0
    for det in all_detections:
        severity_counts[det["severity"]] = severity_counts.get(det["severity"], 0) + 1
        total_confidence += det["confidence"]
    
    avg_confidence = total_confidence / len(all_detections) if all_detections else 0
    
    # Determine overall severity
    if severity_counts["high"] > 0:
        overall_severity = "high"
    elif severity_counts["medium"] > 0:
        overall_severity = "medium"
    elif severity_counts["low"] > 0:
        overall_severity = "low"
    else:
        overall_severity = "unknown"
    
    db_records = [{
        "timestamp": timestamp,
        "latitude": latitude,
        "longitude": longitude,
        "severity": overall_severity,
        "confidence": round(avg_confidence, 4),
        "bbox_x1": None,
        "bbox_y1": None,
        "bbox_x2": None,
        "bbox_y2": None,
        "source_filename": source_filename,
        "source_type": "video",
        "output_filename": output_filename,
        "image_width": width,
        "image_height": height,
        "pothole_count": total_potholes,
        "notes": f"Video analysis: {frame_count} frames processed, {total_potholes} total detections across all frames",
    }]
    
    return {
        "pothole_count": total_potholes,
        "unique_detections": len(all_detections),
        "frames_processed": frame_count,
        "total_frames": total_frames,
        "output_filename": output_filename,
        "output_path": output_path,
        "video_width": width,
        "video_height": height,
        "fps": fps,
        "latitude": latitude,
        "longitude": longitude,
        "severity_summary": severity_counts,
        "overall_severity": overall_severity,
        "average_confidence": round(avg_confidence, 4),
        "db_records": db_records,
        "source_filename": source_filename,
    }


def detect_single_frame(frame: np.ndarray, confidence_threshold: float = 0.25) -> dict:
    """
    Run detection on a single frame (for webcam/live detection).
    
    Args:
        frame: numpy array of the frame (BGR)
        confidence_threshold: Minimum confidence threshold
    
    Returns:
        Dictionary with annotated frame and detections
    """
    model = get_model()
    
    img_height, img_width = frame.shape[:2]
    
    results = model.predict(
        source=frame,
        conf=confidence_threshold,
        verbose=False
    )
    
    detections = []
    annotated = frame.copy()
    
    for result in results:
        boxes = result.boxes
        if boxes is not None and len(boxes) > 0:
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = float(box.conf[0].cpu().numpy())
                
                bbox_width = x2 - x1
                bbox_height = y2 - y1
                severity = estimate_severity(bbox_width, bbox_height, img_width, img_height)
                color = get_severity_color(severity)
                
                cv2.rectangle(annotated,
                             (int(x1), int(y1)), (int(x2), int(y2)),
                             color, 2)
                
                label = f"Pothole {conf:.2f} [{severity.upper()}]"
                label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
                cv2.rectangle(annotated,
                             (int(x1), int(y1) - label_size[1] - 10),
                             (int(x1) + label_size[0], int(y1)),
                             color, -1)
                cv2.putText(annotated, label,
                           (int(x1), int(y1) - 5),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
                
                detections.append({
                    "bbox_x1": float(x1),
                    "bbox_y1": float(y1),
                    "bbox_x2": float(x2),
                    "bbox_y2": float(y2),
                    "confidence": conf,
                    "severity": severity,
                })
    
    return {
        "annotated_frame": annotated,
        "detections": detections,
        "pothole_count": len(detections),
    }
