import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, MapPin, Loader2, Image, AlertTriangle, Eye } from 'lucide-react';
import { detectImage } from '../services/api';
import { toast } from 'sonner';

export default function ImageDetection() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResult(null);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.webp'] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const lat = latitude ? parseFloat(latitude) : null;
      const lon = longitude ? parseFloat(longitude) : null;
      const res = await detectImage(file, confidence, lat, lon);
      setResult(res.data);
      toast.success(`Detected ${res.data.pothole_count} pothole(s)`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Detection failed. Please try again.');
      toast.error('Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const severityStyle = (sev) => ({
    'high': 'bg-[#B85C55]/10 text-[#B85C55]',
    'medium': 'bg-[#C18A45]/10 text-[#C18A45]',
    'low': 'bg-[#526B82]/10 text-[#526B82]',
  }[sev] || 'bg-[#94A3B8]/10 text-[#94A3B8]');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#20242B]">Image Detection</h1>
        <p className="text-[13px] text-[#737B87] mt-1">Upload a road image to detect potholes using YOLO26</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all bg-white ${
              isDragActive ? 'border-[#526B82] bg-[#526B82]/[0.03]' : 'border-[#D1D5DB] hover:border-[#526B82]/50'
            }`}
          >
            <input {...getInputProps()} />
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-56 mx-auto rounded-lg" />
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#F7F8FA] flex items-center justify-center">
                  <Upload className="text-[#737B87]" size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#20242B]">Drop an image here or click to browse</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-1">JPG, PNG, BMP, WebP — max 500 MB</p>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-[#20242B]">Detection Settings</h3>

            <div>
              <label className="text-[12px] text-[#737B87] block mb-2">
                Confidence Threshold: <span className="font-medium text-[#20242B]">{(confidence * 100).toFixed(0)}%</span>
              </label>
              <input type="range" min="0.1" max="0.95" step="0.05" value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] text-[#737B87] flex items-center gap-1 mb-1.5">
                  <MapPin size={12} /> Latitude
                </label>
                <input type="number" step="any" placeholder="e.g. 12.9716" value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-[#20242B] text-[13px] focus:border-[#526B82] focus:outline-none focus:ring-1 focus:ring-[#526B82]/20 transition-colors" />
              </div>
              <div>
                <label className="text-[12px] text-[#737B87] block mb-1.5">Longitude</label>
                <input type="number" step="any" placeholder="e.g. 77.5946" value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-[#20242B] text-[13px] focus:border-[#526B82] focus:outline-none focus:ring-1 focus:ring-[#526B82]/20 transition-colors" />
              </div>
            </div>

            <button
              onClick={handleDetect}
              disabled={!file || loading}
              className="w-full py-2.5 bg-[#526B82] text-white text-[13px] font-medium rounded-lg hover:bg-[#465c70] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Processing...</>
              ) : (
                <><Eye size={16} /> Detect Potholes</>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {error && (
            <div className="bg-[#B85C55]/5 border border-[#B85C55]/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-[#B85C55] mt-0.5 shrink-0" />
              <p className="text-[13px] text-[#B85C55]">{error}</p>
            </div>
          )}

          {result && (
            <div className="animate-fadeIn space-y-4">
              {/* Result Image */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[#20242B]">Detection Result</h3>
                  <a
                    href={`/outputs/${result.output_filename}`}
                    download
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#526B82] hover:text-[#3d5261] font-medium transition-colors"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
                <img src={`/outputs/${result.output_filename}`} alt="Detection result" className="w-full" />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center">
                  <p className="text-2xl font-semibold text-[#526B82] tabular-nums">{result.pothole_count}</p>
                  <p className="text-[11px] text-[#737B87] mt-0.5">Potholes Found</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 text-center">
                  <p className="text-2xl font-semibold text-[#20242B] tabular-nums">{result.image_width}×{result.image_height}</p>
                  <p className="text-[11px] text-[#737B87] mt-0.5">Image Size</p>
                </div>
              </div>

              {/* Detection Details */}
              {result.detections && result.detections.length > 0 && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <h3 className="text-[13px] font-semibold text-[#20242B] mb-3">Detection Details</h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {result.detections.map((det, i) => (
                      <div key={i} className="flex items-center justify-between bg-[#F7F8FA] rounded-lg px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-[#9CA3AF] font-medium w-5">#{i + 1}</span>
                          <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${severityStyle(det.severity)}`}>
                            {det.severity}
                          </span>
                        </div>
                        <span className="text-[13px] text-[#20242B] font-medium tabular-nums">{(det.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-[#C18A45]/5 border border-[#C18A45]/15 rounded-lg px-4 py-3">
                <p className="text-[11px] text-[#C18A45] leading-relaxed">
                  <strong>Note:</strong> Severity is an approximate visual estimate based on bounding box size relative to the image.
                  It does not measure actual physical depth or damage extent.
                </p>
              </div>
            </div>
          )}

          {!result && !error && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#F7F8FA] flex items-center justify-center mb-3">
                <Image className="text-[#D1D5DB]" size={22} strokeWidth={1.75} />
              </div>
              <p className="text-[13px] text-[#9CA3AF]">Upload an image and click "Detect Potholes" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
