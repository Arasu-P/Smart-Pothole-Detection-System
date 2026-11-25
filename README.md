# Smart Pothole Detection and Road Monitoring System using YOLO26

A modern, full-stack, AI-powered computer vision system for real-time pothole detection, visual severity classification, GPS geolocation mapping, and comprehensive road infrastructure monitoring.

---

## 🌟 Key Highlights & Features

- **Pretrained YOLO26m Model**: Fine-tuned YOLO model loaded directly from Hugging Face (`mfranzon/pothole-yolo26`, `best.pt`, 42 MB).
- **Multi-Source Inference**:
  - **Image Detection**: Upload high-resolution road photographs (JPG, PNG, BMP, WebP) with instant bounding box annotations, confidence scores, and downloadable results.
  - **Video Detection**: Frame-by-frame automated road video analysis (MP4, AVI, MOV, MKV) with detection bounding boxes, progress tracking, and downloadable output video.
  - **Live Webcam Detection**: Real-time browser webcam feed stream with client-side canvas rendering, adjustable confidence threshold, live FPS counter, pothole count tracking, and graceful fallback when no camera is present.
- **Visual Severity Estimation**:
  - Heuristic classification into **Low Severity**, **Medium Severity**, and **High Severity** based on bounding box dimensions and relative image surface area.
  - Transparent heuristic disclaimer: clarifies approximate visual severity vs. physical depth measurement.
- **GPS Location & OpenStreetMap Integration**:
  - Interactive Leaflet map displaying pinpoint pothole locations color-coded by severity (Cyan: Low, Yellow: Medium, Red: High).
  - EXIF GPS coordinate extraction from uploaded photos where available.
  - Manual Latitude/Longitude coordinate entry support.
  - Zero fabricated coordinates policy.
- **Road Analytics Dashboard**:
  - Total pothole count, high-severity alerts, image/video processing metrics, average confidence score.
  - Interactive Recharts visualization (Pie chart & Bar chart of severity breakdown).
  - Recent detections feed.
- **Historical Records & Data Management**:
  - SQLite persistent database storing full metadata (bounding boxes, timestamps, GPS, severity, confidence, source).
  - Filter by severity and date range.
  - Detail modal inspection.
  - Record deletion.
  - One-click CSV export (`/api/detections/export`).

---

## 🏗️ Architecture & Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.14 / 3.x)
- **Computer Vision & Deep Learning**: Ultralytics YOLO26 (`ultralytics`), OpenCV (`opencv-python-headless`), PyTorch (`torch`)
- **Database**: SQLite with asynchronous `aiosqlite`
- **File Handling & Multipart**: `aiofiles`, `python-multipart`, `Pillow`
- **Model Storage**: Hugging Face Hub (`huggingface_hub`) cached in `backend/model/best.pt`

### Frontend
- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 (Dark Navy Theme `#0a0e27` with Cyan `#22d3ee` and Blue accents)
- **Mapping**: Leaflet & React-Leaflet with OpenStreetMap tiles
- **Data Visualization**: Recharts (Pie & Bar charts)
- **Icons**: React Icons (Feather Icons)
- **File Upload**: React Dropzone with drag-and-drop support

---

## 📁 Project Structure

```
Smart Pathole Detection System/
├── backend/
│   ├── database/
│   │   ├── __init__.py
│   │   └── db.py                    # SQLite async connection, schema, and queries
│   ├── model/
│   │   └── best.pt                  # Downloaded YOLO26m pretrained weights (42.0 MB)
│   ├── outputs/                     # Annotated output images and videos
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── dashboard.py             # Dashboard statistics endpoints
│   │   └── detection.py             # Detection, history, and CSV export endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── detection_service.py     # YOLO inference for image, video, and frames
│   │   ├── gps_service.py           # EXIF coordinate extraction and validation
│   │   └── severity_service.py      # Bounding-box based severity heuristics
│   ├── uploads/                     # Uploaded raw files
│   ├── main.py                      # FastAPI app entry point & CORS configuration
│   ├── pothole_detections.db        # SQLite database
│   └── requirements.txt             # Python backend dependencies
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.jsx          # Dark navy collapsible navigation sidebar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Road monitoring analytics & charts
│   │   │   ├── ImageDetection.jsx   # Single image upload & detection interface
│   │   │   ├── VideoDetection.jsx   # Video processing & download interface
│   │   │   ├── LiveDetection.jsx    # Real-time webcam feed with live bounding boxes
│   │   │   ├── PotholeMap.jsx       # Interactive Leaflet OpenStreetMap
│   │   │   ├── DetectionHistory.jsx # Filterable table, modal view & CSV export
│   │   │   └── Settings.jsx         # System health, model status & configuration
│   │   ├── services/
│   │   │   └── api.js               # Axios API client functions
│   │   ├── App.jsx                  # Main routing component
│   │   ├── index.css                # Tailwind CSS imports & custom styles
│   │   └── main.jsx                 # React root renderer
│   ├── index.html                   # HTML entry point with Leaflet stylesheets
│   ├── package.json                 # Node.js dependencies
│   └── vite.config.js               # Vite config with API reverse proxy
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart & Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd "backend"
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. The pretrained model is already placed in `backend/model/best.pt`. If you need to re-download it from Hugging Face:
   ```python
   from huggingface_hub import hf_hub_download
   import shutil
   path = hf_hub_download(repo_id="mfranzon/pothole-yolo26", filename="best.pt")
   shutil.copy2(path, "model/best.pt")
   ```
4. Start the FastAPI backend server:
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend API will run at **`http://localhost:8000`**.
   Interactive Swagger documentation is available at **`http://localhost:8000/docs`**.

### 3. Frontend Setup
1. Open another terminal and navigate to the `frontend` directory:
   ```bash
   cd "frontend"
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend application will run at **`http://localhost:5173`**.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check and YOLO model status (`healthy`, `loaded`) |
| `POST` | `/api/detect/image` | Upload image (multipart/form-data) + confidence & GPS coordinates |
| `POST` | `/api/detect/video` | Upload video (multipart/form-data) + confidence & GPS coordinates |
| `GET` | `/api/detections` | Query detection records with filters (`severity`, `start_date`, `end_date`, `limit`, `offset`) |
| `GET` | `/api/detections/{id}` | Get complete detection record details by ID |
| `DELETE` | `/api/detections/{id}` | Delete a detection record by ID |
| `GET` | `/api/dashboard/stats` | Aggregate dashboard metrics and severity distribution |
| `GET` | `/api/detections/export` | Download all detection records as a CSV spreadsheet |

---

## 🔍 Severity Estimation Heuristic

Potholes are classified visually using bounding box geometric heuristics:
- **High Severity**: Bounding box area $> 5\%$ of total image area.
- **Medium Severity**: Bounding box area between $1.5\%$ and $5\%$, or elongated aspect ratio $> 4$ indicating longitudinal surface cracking.
- **Low Severity**: Bounding box area $< 1.5\%$ of total image area.

> **Visual Severity Disclaimer**: This is an approximate visual heuristic based on pixel coverage in 2D perspective. It does not measure physical volumetric depth or sub-surface road damage.

---

## 🌐 Live Application Access

- **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
