import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, Download, MapPin, Loader2, AlertTriangle, Eye } from 'lucide-react';
import { detectVideo } from '../services/api';
import { toast } from 'sonner';

export default function VideoDetection() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    const f = acceptedFiles[0];
    if (f) {
      setFile(f);
      setResult(null);
      setError(null);
      setUploadProgress(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm'] },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const lat = latitude ? parseFloat(latitude) : null;
      const lon = longitude ? parseFloat(longitude) : null;
      const res = await detectVideo(file, confidence, lat, lon, (progressEvent) => {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(pct);
      });
      setResult(res.data);
      toast.success(`Detected ${res.data.pothole_count} pothole(s) across ${res.data.frames_processed} frames`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Video detection failed. Please try again.');
      toast.error('Video analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const severityTextColor = (sev) => ({
    'high': 'text-[#B85C55]',
    'medium': 'text-[#C18A45]',
    'low': 'text-[#526B82]',
  }[sev] || 'text-[#737B87]');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#20242B]">Video Detection</h1>
        <p className="text-[13px] text-[#737B87] mt-1">Upload road footage to detect potholes frame by frame</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload */}
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-xl p-8 text-center cursor-pointer transition-all bg-white ${
              isDragActive ? 'border-[#526B82] bg-[#526B82]/[0.03]' : 'border-[#D1D5DB] hover:border-[#526B82]/50'
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="space-y-2 py-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#526B82]/8 flex items-center justify-center">
                  <Video className="text-[#526B82]" size={22} strokeWidth={1.75} />
                </div>
                <p className="text-[13px] font-medium text-[#20242B]">{file.name}</p>
                <p className="text-[12px] text-[#9CA3AF]">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
              </div>
            ) : (
              <div className="space-y-3 py-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-[#F7F8FA] flex items-center justify-center">
                  <Upload className="text-[#737B87]" size={22} strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#20242B]">Drop a video here or click to browse</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-1">MP4, AVI, MOV, MKV, WebM — max 500 MB</p>
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
                <><Loader2 size={16} className="animate-spin" /> Processing Video...</>
              ) : (
                <><Eye size={16} /> Analyze Video</>
              )}
            </button>

            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-[12px] text-[#737B87]">
                  <span>{uploadProgress < 100 ? 'Uploading...' : 'Processing frames...'}</span>
                  <span className="tabular-nums">{uploadProgress < 100 ? `${uploadProgress}%` : 'Analyzing...'}</span>
                </div>
                <div className="w-full bg-[#E5E7EB] rounded-full h-1.5">
                  <div className="bg-[#526B82] h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress < 100 ? uploadProgress : 100}%` }} />
                </div>
                <p className="text-[11px] text-[#C18A45]">Video analysis may take a few minutes depending on length.</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {error && (
            <div className="bg-[#B85C55]/5 border border-[#B85C55]/20 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={16} className="text-[#B85C55] mt-0.5 shrink-0" />
              <p className="text-[13px] text-[#B85C55]">{error}</p>
            </div>
          )}

          {result && (
            <div className="animate-fadeIn space-y-4">
              {/* Output Video */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-[#20242B]">Processed Video</h3>
                  <a href={`/outputs/${result.output_filename}`} download
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#526B82] hover:text-[#3d5261] font-medium transition-colors">
                    <Download size={13} /> Download
                  </a>
                </div>
                <video controls className="w-full" src={`/outputs/${result.output_filename}`} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-[#526B82] tabular-nums">{result.pothole_count}</p>
                  <p className="text-[10px] text-[#737B87]">Total Detections</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-[#20242B] tabular-nums">{result.frames_processed}</p>
                  <p className="text-[10px] text-[#737B87]">Frames Analyzed</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 text-center">
                  <p className="text-lg font-semibold text-[#708B76] tabular-nums">{(result.average_confidence * 100).toFixed(1)}%</p>
                  <p className="text-[10px] text-[#737B87]">Avg Confidence</p>
                </div>
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-3 text-center">
                  <p className={`text-lg font-semibold ${severityTextColor(result.overall_severity)}`}>
                    {result.overall_severity?.toUpperCase()}
                  </p>
                  <p className="text-[10px] text-[#737B87]">Overall Severity</p>
                </div>
              </div>

              {/* Severity Breakdown */}
              {result.severity_summary && (
                <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                  <h3 className="text-[13px] font-semibold text-[#20242B] mb-3">Severity Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(result.severity_summary).map(([sev, count]) => (
                      <div key={sev} className="flex items-center justify-between bg-[#F7F8FA] rounded-lg px-3 py-2">
                        <span className={`text-[13px] capitalize font-medium ${severityTextColor(sev)}`}>{sev}</span>
                        <span className="text-[13px] text-[#20242B] font-medium tabular-nums">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && !error && (
            <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-[#F7F8FA] flex items-center justify-center mb-3">
                <Video className="text-[#D1D5DB]" size={22} strokeWidth={1.75} />
              </div>
              <p className="text-[13px] text-[#9CA3AF]">Upload a video and click "Analyze Video" to see results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
