"""Database models and schema for the pothole detection system."""

import aiosqlite
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pothole_detections.db")


async def get_db():
    """Get database connection."""
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db


async def init_db():
    """Initialize the database tables."""
    db = await aiosqlite.connect(DB_PATH)
    await db.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL DEFAULT (datetime('now')),
            latitude REAL,
            longitude REAL,
            severity TEXT NOT NULL DEFAULT 'unknown',
            confidence REAL NOT NULL DEFAULT 0.0,
            bbox_x1 REAL,
            bbox_y1 REAL,
            bbox_x2 REAL,
            bbox_y2 REAL,
            source_filename TEXT,
            source_type TEXT DEFAULT 'image',
            output_filename TEXT,
            image_width INTEGER,
            image_height INTEGER,
            pothole_count INTEGER DEFAULT 1,
            notes TEXT
        )
    """)
    await db.commit()
    await db.close()


async def save_detection(detection: dict) -> int:
    """Save a detection record and return its ID."""
    db = await get_db()
    try:
        cursor = await db.execute("""
            INSERT INTO detections 
            (timestamp, latitude, longitude, severity, confidence, 
             bbox_x1, bbox_y1, bbox_x2, bbox_y2, 
             source_filename, source_type, output_filename,
             image_width, image_height, pothole_count, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            detection.get("timestamp", datetime.now().isoformat()),
            detection.get("latitude"),
            detection.get("longitude"),
            detection.get("severity", "unknown"),
            detection.get("confidence", 0.0),
            detection.get("bbox_x1"),
            detection.get("bbox_y1"),
            detection.get("bbox_x2"),
            detection.get("bbox_y2"),
            detection.get("source_filename"),
            detection.get("source_type", "image"),
            detection.get("output_filename"),
            detection.get("image_width"),
            detection.get("image_height"),
            detection.get("pothole_count", 1),
            detection.get("notes"),
        ))
        await db.commit()
        return cursor.lastrowid
    finally:
        await db.close()


async def save_detections_batch(detections: list) -> list:
    """Save multiple detection records and return their IDs."""
    ids = []
    db = await get_db()
    try:
        for detection in detections:
            cursor = await db.execute("""
                INSERT INTO detections 
                (timestamp, latitude, longitude, severity, confidence, 
                 bbox_x1, bbox_y1, bbox_x2, bbox_y2, 
                 source_filename, source_type, output_filename,
                 image_width, image_height, pothole_count, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                detection.get("timestamp", datetime.now().isoformat()),
                detection.get("latitude"),
                detection.get("longitude"),
                detection.get("severity", "unknown"),
                detection.get("confidence", 0.0),
                detection.get("bbox_x1"),
                detection.get("bbox_y1"),
                detection.get("bbox_x2"),
                detection.get("bbox_y2"),
                detection.get("source_filename"),
                detection.get("source_type", "image"),
                detection.get("output_filename"),
                detection.get("image_width"),
                detection.get("image_height"),
                detection.get("pothole_count", 1),
                detection.get("notes"),
            ))
            ids.append(cursor.lastrowid)
        await db.commit()
        return ids
    finally:
        await db.close()


async def get_all_detections(severity: str = None, start_date: str = None, 
                              end_date: str = None, limit: int = 100, offset: int = 0):
    """Get all detections with optional filters."""
    db = await get_db()
    try:
        query = "SELECT * FROM detections WHERE 1=1"
        params = []
        
        if severity and severity != "all":
            query += " AND severity = ?"
            params.append(severity)
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)
        
        query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_detection_by_id(detection_id: int):
    """Get a single detection by ID."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM detections WHERE id = ?", (detection_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def delete_detection(detection_id: int) -> bool:
    """Delete a detection record."""
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM detections WHERE id = ?", (detection_id,))
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


async def get_dashboard_stats():
    """Get dashboard statistics."""
    db = await get_db()
    try:
        stats = {}
        
        # Total detections
        cursor = await db.execute("SELECT COUNT(*) as count FROM detections")
        row = await cursor.fetchone()
        stats["total_detections"] = row["count"]
        
        # High severity count
        cursor = await db.execute("SELECT COUNT(*) as count FROM detections WHERE severity = 'high'")
        row = await cursor.fetchone()
        stats["high_severity_count"] = row["count"]
        
        # Medium severity count
        cursor = await db.execute("SELECT COUNT(*) as count FROM detections WHERE severity = 'medium'")
        row = await cursor.fetchone()
        stats["medium_severity_count"] = row["count"]
        
        # Low severity count
        cursor = await db.execute("SELECT COUNT(*) as count FROM detections WHERE severity = 'low'")
        row = await cursor.fetchone()
        stats["low_severity_count"] = row["count"]
        
        # Unique source files (images/videos processed)
        cursor = await db.execute("SELECT COUNT(DISTINCT source_filename) as count FROM detections")
        row = await cursor.fetchone()
        stats["total_files_processed"] = row["count"]
        
        # Images processed
        cursor = await db.execute(
            "SELECT COUNT(DISTINCT source_filename) as count FROM detections WHERE source_type = 'image'"
        )
        row = await cursor.fetchone()
        stats["images_processed"] = row["count"]
        
        # Videos processed
        cursor = await db.execute(
            "SELECT COUNT(DISTINCT source_filename) as count FROM detections WHERE source_type = 'video'"
        )
        row = await cursor.fetchone()
        stats["videos_processed"] = row["count"]
        
        # Severity distribution
        stats["severity_distribution"] = [
            {"name": "Low", "value": stats["low_severity_count"]},
            {"name": "Medium", "value": stats["medium_severity_count"]},
            {"name": "High", "value": stats["high_severity_count"]},
        ]
        
        # Recent detections (last 10)
        cursor = await db.execute(
            "SELECT * FROM detections ORDER BY timestamp DESC LIMIT 10"
        )
        rows = await cursor.fetchall()
        stats["recent_detections"] = [dict(row) for row in rows]
        
        # Average confidence
        cursor = await db.execute("SELECT AVG(confidence) as avg_conf FROM detections")
        row = await cursor.fetchone()
        stats["average_confidence"] = round(row["avg_conf"], 2) if row["avg_conf"] else 0
        
        # Detections with location
        cursor = await db.execute(
            "SELECT COUNT(*) as count FROM detections WHERE latitude IS NOT NULL AND longitude IS NOT NULL"
        )
        row = await cursor.fetchone()
        stats["detections_with_location"] = row["count"]
        
        return stats
    finally:
        await db.close()


async def get_detections_for_export(severity: str = None, start_date: str = None, end_date: str = None):
    """Get all detections for CSV export."""
    db = await get_db()
    try:
        query = "SELECT * FROM detections WHERE 1=1"
        params = []
        
        if severity and severity != "all":
            query += " AND severity = ?"
            params.append(severity)
        if start_date:
            query += " AND timestamp >= ?"
            params.append(start_date)
        if end_date:
            query += " AND timestamp <= ?"
            params.append(end_date)
        
        query += " ORDER BY timestamp DESC"
        
        cursor = await db.execute(query, params)
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()
