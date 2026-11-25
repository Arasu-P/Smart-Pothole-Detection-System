"""Severity estimation service for pothole detection.

This module provides approximate visual severity estimation based on
bounding box dimensions and relative area. This is NOT a true physical
depth measurement - it's a heuristic based on the visual size of the
detected pothole relative to the image.
"""


def estimate_severity(bbox_width: float, bbox_height: float, 
                       image_width: int, image_height: int) -> str:
    """
    Estimate pothole severity based on bounding box dimensions.
    
    Uses the ratio of the bounding box area to the total image area
    as a proxy for severity. Larger potholes (relative to the image)
    are assumed to be more severe.
    
    NOTE: This is an approximate visual severity estimate based on
    bounding box size. It does not measure actual physical depth,
    volume, or road damage extent. A proper severity assessment
    would require depth sensors, 3D reconstruction, or field inspection.
    
    Args:
        bbox_width: Width of the bounding box in pixels
        bbox_height: Height of the bounding box in pixels
        image_width: Total image width in pixels
        image_height: Total image height in pixels
    
    Returns:
        str: "low", "medium", or "high"
    """
    if image_width == 0 or image_height == 0:
        return "unknown"
    
    bbox_area = bbox_width * bbox_height
    image_area = image_width * image_height
    area_ratio = bbox_area / image_area
    
    # Also consider aspect ratio - very elongated potholes may indicate cracks
    aspect_ratio = max(bbox_width, bbox_height) / max(min(bbox_width, bbox_height), 1)
    
    # Combined scoring
    # Area ratio thresholds (these are empirical heuristics)
    if area_ratio > 0.05:  # More than 5% of image area
        return "high"
    elif area_ratio > 0.015:  # Between 1.5% and 5%
        return "medium"
    elif area_ratio > 0.003:  # Between 0.3% and 1.5%
        # If highly elongated, might be a significant crack
        if aspect_ratio > 4:
            return "medium"
        return "low"
    else:
        return "low"


def get_severity_color(severity: str) -> tuple:
    """Get BGR color for severity level visualization."""
    colors = {
        "low": (0, 255, 0),       # Green
        "medium": (0, 165, 255),   # Orange
        "high": (0, 0, 255),       # Red
        "unknown": (128, 128, 128) # Gray
    }
    return colors.get(severity, (128, 128, 128))


def get_severity_description(severity: str) -> str:
    """Get human-readable description of severity level."""
    descriptions = {
        "low": "Minor surface damage. Small pothole that may not require immediate attention.",
        "medium": "Moderate damage. Pothole of notable size that should be scheduled for repair.",
        "high": "Severe damage. Large pothole that poses significant risk and needs urgent repair.",
        "unknown": "Severity could not be determined."
    }
    return descriptions.get(severity, descriptions["unknown"])
