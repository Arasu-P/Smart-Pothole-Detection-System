"""GPS location service for pothole detection.

Handles GPS coordinate validation, storage, and management.
Does NOT fabricate GPS coordinates - only stores what is provided
by the user or device.
"""


def validate_coordinates(latitude: float, longitude: float) -> bool:
    """
    Validate GPS coordinates.
    
    Args:
        latitude: Latitude value (-90 to 90)
        longitude: Longitude value (-180 to 180)
    
    Returns:
        bool: True if coordinates are valid
    """
    if latitude is None or longitude is None:
        return False
    try:
        lat = float(latitude)
        lon = float(longitude)
        return -90 <= lat <= 90 and -180 <= lon <= 180
    except (TypeError, ValueError):
        return False


def format_coordinates(latitude: float, longitude: float) -> str:
    """Format coordinates for display."""
    if latitude is None or longitude is None:
        return "Location not available"
    
    lat_dir = "N" if latitude >= 0 else "S"
    lon_dir = "E" if longitude >= 0 else "W"
    
    return f"{abs(latitude):.6f}°{lat_dir}, {abs(longitude):.6f}°{lon_dir}"


def parse_gps_from_exif(image_path: str) -> dict:
    """
    Attempt to extract GPS coordinates from image EXIF data.
    
    Args:
        image_path: Path to the image file
    
    Returns:
        dict with 'latitude' and 'longitude' keys, or None values if not found
    """
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS, GPSTAGS
        
        img = Image.open(image_path)
        exif_data = img._getexif()
        
        if not exif_data:
            return {"latitude": None, "longitude": None}
        
        gps_info = {}
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == "GPSInfo":
                for gps_tag_id, gps_value in value.items():
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag] = gps_value
        
        if not gps_info:
            return {"latitude": None, "longitude": None}
        
        # Extract latitude
        if "GPSLatitude" in gps_info and "GPSLatitudeRef" in gps_info:
            lat = _convert_to_degrees(gps_info["GPSLatitude"])
            if gps_info["GPSLatitudeRef"] == "S":
                lat = -lat
        else:
            lat = None
        
        # Extract longitude
        if "GPSLongitude" in gps_info and "GPSLongitudeRef" in gps_info:
            lon = _convert_to_degrees(gps_info["GPSLongitude"])
            if gps_info["GPSLongitudeRef"] == "W":
                lon = -lon
        else:
            lon = None
        
        return {"latitude": lat, "longitude": lon}
    
    except Exception:
        return {"latitude": None, "longitude": None}


def _convert_to_degrees(value):
    """Convert GPS coordinate from EXIF format to degrees."""
    try:
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)
    except (IndexError, TypeError, ValueError):
        return None
