import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, Play, Square, AlertCircle, Info, Gauge, Crosshair } from 'lucide-react';

export default function LiveDetection() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(null);
  const [fps, setFps] = useState(0);
  const [potholeCount, setPotholeCount] = useState(0);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const lastFrameTime = useRef(Date.now());
  const frameCount = useRef(0);

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setCameraAvailable(true);
    } else {
      setCameraAvailable(false);
      setError('Camera access is not available in this browser or context.');
    }
    return () => stopDetection();
  }, []);

  const startDetection = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsRunning(true);
      processFrames();
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera.');
      } else {
        setError(`Camera error: ${err.message}`);
      }
      setCameraAvailable(false);
    }
  };

  const stopDetection = () => {
    setIsRunning(false);
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const processFrames = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isRunning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const processLoop = async () => {
      if (!streamRef.current) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
        const formData = new FormData();
        formData.append('file', blob, 'webcam_frame.jpg');
        formData.append('confidence', confidence);

        const response = await fetch('/api/detect/image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const result = data.data;
          setPotholeCount(result.pothole_count);

          if (result.detections) {
            const scaleX = canvas.width / result.image_width;
            const scaleY = canvas.height / result.image_height;

            result.detections.forEach(det => {
              const x1 = det.bbox_x1 * scaleX;
              const y1 = det.bbox_y1 * scaleY;
              const x2 = det.bbox_x2 * scaleX;
              const y2 = det.bbox_y2 * scaleY;

              const color = det.severity === 'high' ? '#B85C55' :
                           det.severity === 'medium' ? '#C18A45' : '#526B82';

              ctx.strokeStyle = color;
              ctx.lineWidth = 2;
              ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

              ctx.fillStyle = color;
              ctx.font = '600 13px Inter, sans-serif';
              ctx.fillText(
                `Pothole ${(det.confidence * 100).toFixed(0)}% [${det.severity.toUpperCase()}]`,
                x1, y1 - 6
              );
            });
          }
        }
      } catch (err) {
        // Silently handle frame processing errors
      }

      frameCount.current++;
      const now = Date.now();
      if (now - lastFrameTime.current >= 1000) {
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      if (streamRef.current) {
        setTimeout(() => {
          animFrameRef.current = requestAnimationFrame(processLoop);
        }, 200);
      }
    };

    processLoop();
  }, [confidence]);

  useEffect(() => {
    if (isRunning) {
      processFrames();
    }
  }, [isRunning, processFrames]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#20242B]">Live Detection</h1>
        <p className="text-[13px] text-[#737B87] mt-1">Real-time pothole detection using your webcam</p>
      </div>

      {error && (
        <div className="bg-[#B85C55]/5 border border-[#B85C55]/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={16} className="text-[#B85C55] mt-0.5 shrink-0" />
          <p className="text-[13px] text-[#B85C55]">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Feed */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-[#20242B] flex items-center gap-2">
              <Camera size={16} className="text-[#526B82]" /> Camera Feed
              {isRunning && <span className="w-2 h-2 rounded-full bg-[#708B76] animate-pulse" />}
            </h3>
            <span className="text-[12px] text-[#737B87] tabular-nums">{fps} FPS</span>
          </div>
          <div className="relative aspect-video bg-[#F7F8FA]">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" style={{ display: isRunning ? 'block' : 'none' }} muted playsInline />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" style={{ display: isRunning ? 'block' : 'none' }} />
            {!isRunning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-xl bg-[#E5E7EB]/50 flex items-center justify-center mb-3">
                    <CameraOff className="text-[#9CA3AF]" size={24} strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] text-[#9CA3AF]">Camera is off. Click Start to begin detection.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-[#20242B]">Controls</h3>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={startDetection} disabled={isRunning || cameraAvailable === false}
                className="py-2.5 bg-[#708B76]/10 text-[#708B76] text-[13px] font-medium rounded-lg hover:bg-[#708B76]/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                <Play size={15} /> Start
              </button>
              <button onClick={stopDetection} disabled={!isRunning}
                className="py-2.5 bg-[#B85C55]/10 text-[#B85C55] text-[13px] font-medium rounded-lg hover:bg-[#B85C55]/15 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                <Square size={13} /> Stop
              </button>
            </div>

            <div>
              <label className="text-[12px] text-[#737B87] block mb-2">
                Confidence: <span className="font-medium text-[#20242B]">{(confidence * 100).toFixed(0)}%</span>
              </label>
              <input type="range" min="0.1" max="0.95" step="0.05" value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full" />
            </div>
          </div>

          {/* Live Stats */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-3">
            <h3 className="text-[13px] font-semibold text-[#20242B]">Live Stats</h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                <span className="text-[12px] text-[#737B87] flex items-center gap-1.5"><Crosshair size={13} /> Potholes</span>
                <span className="text-lg font-semibold text-[#526B82] tabular-nums">{potholeCount}</span>
              </div>
              <div className="flex items-center justify-between bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                <span className="text-[12px] text-[#737B87] flex items-center gap-1.5"><Gauge size={13} /> FPS</span>
                <span className="text-lg font-semibold text-[#20242B] tabular-nums">{fps}</span>
              </div>
              <div className="flex items-center justify-between bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                <span className="text-[12px] text-[#737B87]">Status</span>
                <span className={`text-[12px] font-medium flex items-center gap-1.5 ${isRunning ? 'text-[#708B76]' : 'text-[#9CA3AF]'}`}>
                  {isRunning && <span className="w-1.5 h-1.5 rounded-full bg-[#708B76]" />}
                  {isRunning ? 'Running' : 'Stopped'}
                </span>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="bg-[#526B82]/5 border border-[#526B82]/10 rounded-lg px-4 py-3">
            <p className="text-[11px] text-[#526B82] leading-relaxed flex items-start gap-1.5">
              <Info size={12} className="shrink-0 mt-0.5" />
              Live detection sends frames to the backend at ~5 FPS. Performance depends on hardware.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
