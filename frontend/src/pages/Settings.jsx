import React, { useState, useEffect } from 'react';
import { 
  Server, Cpu, CheckCircle2, XCircle, RefreshCw, 
  Database, HardDrive, ShieldCheck, AlertCircle, ExternalLink, Code2
} from 'lucide-react';
import { healthCheck } from '../services/api';
import { toast } from 'sonner';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await healthCheck();
      setHealth(res);
      toast.success('System status verified');
    } catch (err) {
      setHealth({ status: 'error', model_status: 'unreachable' });
      toast.error('Unable to reach backend services');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#20242B]">System Settings & Telemetry</h1>
          <p className="text-[13px] text-[#737B87] mt-1">Infrastructure diagnostics, model configurations, and runtime health</p>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] text-[#20242B] text-[13px] font-medium rounded-lg hover:border-[#D1D5DB] transition-all disabled:opacity-50 shadow-xs"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-[#526B82]' : 'text-[#737B87]'} />
          Verify Diagnostics
        </button>
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#526B82]/8 flex items-center justify-center">
                <Server size={16} className="text-[#526B82]" />
              </div>
              <div>
                <h2 className="text-[14px] font-semibold text-[#20242B]">Infrastructure Health</h2>
                <p className="text-[11px] text-[#737B87]">API Gateway and inference engine status</p>
              </div>
            </div>
            {health?.status === 'healthy' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#708B76]/10 text-[#708B76]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#708B76] animate-pulse" />
                Operational
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#B85C55]/10 text-[#B85C55]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B85C55]" />
                Degraded
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-lg">
              <span className="text-[13px] text-[#20242B] font-medium">FastAPI Server</span>
              <div className="flex items-center gap-1.5 text-[12px]">
                {health?.status === 'healthy' ? (
                  <>
                    <CheckCircle2 size={15} className="text-[#708B76]" />
                    <span className="text-[#708B76] font-medium">Active (Port 8000)</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} className="text-[#B85C55]" />
                    <span className="text-[#B85C55] font-medium">Unreachable</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-lg">
              <span className="text-[13px] text-[#20242B] font-medium">YOLO26 Inference Engine</span>
              <div className="flex items-center gap-1.5 text-[12px]">
                {health?.model_status === 'loaded' ? (
                  <>
                    <CheckCircle2 size={15} className="text-[#708B76]" />
                    <span className="text-[#708B76] font-medium">Weights Loaded</span>
                  </>
                ) : (
                  <>
                    <XCircle size={15} className="text-[#B85C55]" />
                    <span className="text-[#B85C55] font-medium">{health?.model_status || 'Unavailable'}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-lg">
              <span className="text-[13px] text-[#20242B] font-medium">Backend Build Version</span>
              <span className="text-[12px] font-mono text-[#737B87]">{health?.version || 'v1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* Model Architecture */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#526B82]/8 flex items-center justify-center">
              <Cpu size={16} className="text-[#526B82]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#20242B]">Model Specifications</h2>
              <p className="text-[11px] text-[#737B87]">Ultralytics neural network configuration</p>
            </div>
          </div>

          <div className="space-y-3 text-[13px]">
            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-lg">
              <span className="text-[#737B87]">Base Model</span>
              <span className="text-[#20242B] font-medium">YOLO26m (Medium Variant)</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-lg">
              <span className="text-[#737B87]">Trained Checkpoint</span>
              <span className="text-[#20242B] font-mono text-[12px]">mfranzon/pothole-yolo26</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-[#F7F8FA] rounded-lg">
              <span className="text-[#737B87]">Model Size / Parameters</span>
              <span className="text-[#20242B] font-medium">41.96 MB (21.77M params)</span>
            </div>
          </div>
        </div>

        {/* System Stack & Environment */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#708B76]/10 flex items-center justify-center">
              <Code2 size={16} className="text-[#708B76]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#20242B]">Software Architecture</h2>
              <p className="text-[11px] text-[#737B87]">Core dependencies and environment runtimes</p>
            </div>
          </div>

          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span className="text-[#737B87]">Frontend Framework</span>
              <span className="text-[#20242B] font-medium">React 19 + Vite 6 + Tailwind CSS</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span className="text-[#737B87]">Backend Framework</span>
              <span className="text-[#20242B] font-medium">FastAPI (Python 3.14)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span className="text-[#737B87]">Computer Vision</span>
              <span className="text-[#20242B] font-medium">OpenCV + PyTorch 2.6</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#737B87]">Database Engine</span>
              <span className="text-[#20242B] font-medium">SQLite (aiosqlite asynchronous)</span>
            </div>
          </div>
        </div>

        {/* Runtime Limits & Upload Constraints */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#526B82]/8 flex items-center justify-center">
              <HardDrive size={16} className="text-[#526B82]" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-[#20242B]">I/O Pipeline Constraints</h2>
              <p className="text-[11px] text-[#737B87]">File handling and network timeout parameters</p>
            </div>
          </div>

          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span className="text-[#737B87]">Max Single Ingestion Size</span>
              <span className="text-[#20242B] font-medium">500 MB</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span className="text-[#737B87]">Supported Image Formats</span>
              <span className="text-[#20242B] font-mono text-[12px]">.jpg, .jpeg, .png, .bmp, .webp</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#F3F4F6]">
              <span className="text-[#737B87]">Supported Video Codecs</span>
              <span className="text-[#20242B] font-mono text-[12px]">.mp4, .avi, .mov, .mkv, .webm</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[#737B87]">HTTP Client Timeout</span>
              <span className="text-[#20242B] font-medium">300 seconds (5 min video stream)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Disclaimer */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#C18A45]/10 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle size={18} className="text-[#C18A45]" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[14px] font-semibold text-[#20242B]">
              Severity Estimation Disclaimer & Methodology
            </h3>
            <p className="text-[12px] text-[#737B87] leading-relaxed">
              The automated classification (Low, Medium, High Severity) is calculated using a geometric heuristic 
              evaluating bounding-box surface area relative to total sensor resolution, modulated by visual detection confidence. 
              This is an <strong>approximate optical surface estimate</strong> and does not evaluate physical 3D volumetric depth, 
              subsurface pavement failure, or sub-base degradation. For formal structural engineering repairs, 
              combine these alerts with certified field profiling or LiDAR inspection.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
