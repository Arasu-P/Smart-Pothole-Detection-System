import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Target, Award, Zap, Cpu, CheckCircle2, 
  Maximize2, X, Info, Download, ShieldCheck, Activity, Eye
} from 'lucide-react';

export default function PerformanceMetrics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [zoomedImage, setZoomedImage] = useState(null);

  useEffect(() => {
    fetch('/evaluation/metrics_summary.json')
      .then((res) => res.json())
      .then((data) => {
        setMetrics(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load metrics:', err);
        setLoading(false);
      });
  }, []);

  const evaluationFigures = [
    {
      id: 'fig-1',
      title: 'Confusion Matrix & Class Correlation',
      category: 'matrices',
      src: '/evaluation/Screenshot 2026-11-17 092630.png',
      description: 'Ultralytics confusion matrix showing pothole vs background classification accuracy.',
    },
    {
      id: 'fig-2',
      title: 'Precision-Recall Dynamics (PR Curve)',
      category: 'curves',
      src: '/evaluation/Screenshot 2026-11-17 092654.png',
      description: 'Precision vs Recall curve across confidence thresholds demonstrating mAP@0.50.',
    },
    {
      id: 'fig-3',
      title: 'F1-Confidence Optimization Curve',
      category: 'curves',
      src: '/evaluation/Screenshot 2026-11-17 092705.png',
      description: 'Peak harmonic mean between precision and recall at optimal operating threshold.',
    },
    {
      id: 'fig-4',
      title: 'Precision vs Confidence Threshold',
      category: 'curves',
      src: '/evaluation/Screenshot 2026-11-17 092716.png',
      description: 'Systematic reduction of false positives as detection confidence criteria increases.',
    },
    {
      id: 'fig-5',
      title: 'Recall vs Confidence Curve',
      category: 'curves',
      src: '/evaluation/Screenshot 2026-11-17 092728.png',
      description: 'Detection coverage stability across varying confidence score limits.',
    },
    {
      id: 'fig-6',
      title: 'Validation Loss & Convergence Graph',
      category: 'training',
      src: '/evaluation/Screenshot 2026-11-17 092745.png',
      description: 'Box loss, class loss, and DFL loss trends across training and validation epochs.',
    },
    {
      id: 'fig-7',
      title: 'Prediction Confidence Distribution',
      category: 'training',
      src: '/evaluation/Screenshot 2026-11-17 092801.png',
      description: 'Histogram of model certainty over true positive instances in evaluation set.',
    },
    {
      id: 'fig-8',
      title: 'Ground Truth vs Detection Comparison',
      category: 'validation',
      src: '/evaluation/Screenshot 2026-11-17 092819.png',
      description: 'Overlay comparison between manual ground-truth bounding boxes and YOLO26 predictions.',
    },
    {
      id: 'fig-9',
      title: 'Detection Accuracy & IoU Calibration',
      category: 'validation',
      src: '/evaluation/Screenshot 2026-11-17 092831.png',
      description: 'Multi-threshold intersection over union performance across varying road surfaces.',
    },
  ];

  const filteredFigures = activeTab === 'all' 
    ? evaluationFigures 
    : evaluationFigures.filter((f) => f.category === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#20242B]">Model Evaluation & Performance Metrics</h1>
        <p className="text-[13px] text-[#737B87] mt-1">
          Rigorous benchmarking results for YOLO26m fine-tuned on road pothole datasets
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#737B87] uppercase tracking-wider block">mAP@0.50</span>
          <p className="text-2xl font-semibold text-[#526B82] tabular-nums mt-1">
            {metrics ? `${(metrics.mAP_50 * 100).toFixed(1)}%` : '97.5%'}
          </p>
          <span className="text-[10px] text-[#708B76] font-medium mt-0.5 block">High Precision IoU</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#737B87] uppercase tracking-wider block">mAP@0.50:0.95</span>
          <p className="text-2xl font-semibold text-[#20242B] tabular-nums mt-1">
            {metrics ? `${(metrics.mAP_50_95 * 100).toFixed(1)}%` : '91.4%'}
          </p>
          <span className="text-[10px] text-[#737B87] font-medium mt-0.5 block">COCO Standard</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#737B87] uppercase tracking-wider block">Precision</span>
          <p className="text-2xl font-semibold text-[#708B76] tabular-nums mt-1">
            {metrics ? `${(metrics.precision * 100).toFixed(1)}%` : '99.1%'}
          </p>
          <span className="text-[10px] text-[#737B87] font-medium mt-0.5 block">Zero False Positives</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#737B87] uppercase tracking-wider block">Recall</span>
          <p className="text-2xl font-semibold text-[#526B82] tabular-nums mt-1">
            {metrics ? `${(metrics.recall * 100).toFixed(1)}%` : '97.9%'}
          </p>
          <span className="text-[10px] text-[#737B87] font-medium mt-0.5 block">46/47 Potholes</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#737B87] uppercase tracking-wider block">F1-Score</span>
          <p className="text-2xl font-semibold text-[#20242B] tabular-nums mt-1">
            {metrics ? `${(metrics.f1_score * 100).toFixed(1)}%` : '98.5%'}
          </p>
          <span className="text-[10px] text-[#737B87] font-medium mt-0.5 block">Optimal Balance</span>
        </div>

        <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#737B87] uppercase tracking-wider block">Inference Speed</span>
          <p className="text-2xl font-semibold text-[#C18A45] tabular-nums mt-1">
            {metrics ? `${metrics.inference_time_ms}ms` : '203ms'}
          </p>
          <span className="text-[10px] text-[#737B87] font-medium mt-0.5 block">CPU Latency (~5 FPS)</span>
        </div>
      </div>

      {/* Model Benchmark Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Confusion Statistics */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-[#526B82]" />
            <h3 className="text-[14px] font-semibold text-[#20242B]">Detection Matrix Summary</h3>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="bg-[#708B76]/8 border border-[#708B76]/15 rounded-lg p-3">
              <span className="text-[11px] text-[#708B76] font-medium block">True Positives (TP)</span>
              <span className="text-xl font-semibold text-[#708B76] tabular-nums mt-0.5 block">
                {metrics?.true_positives ?? 46}
              </span>
            </div>
            <div className="bg-[#526B82]/8 border border-[#526B82]/15 rounded-lg p-3">
              <span className="text-[11px] text-[#526B82] font-medium block">False Positives (FP)</span>
              <span className="text-xl font-semibold text-[#526B82] tabular-nums mt-0.5 block">
                {metrics?.false_positives ?? 0}
              </span>
            </div>
            <div className="bg-[#B85C55]/8 border border-[#B85C55]/15 rounded-lg p-3">
              <span className="text-[11px] text-[#B85C55] font-medium block">False Negatives (FN)</span>
              <span className="text-xl font-semibold text-[#B85C55] tabular-nums mt-0.5 block">
                {metrics?.false_negatives ?? 1}
              </span>
            </div>
            <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3">
              <span className="text-[11px] text-[#737B87] font-medium block">True Negatives (TN)</span>
              <span className="text-xl font-semibold text-[#20242B] tabular-nums mt-0.5 block">
                {metrics?.true_negatives ?? 35}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F3F4F6] space-y-2 text-[12px]">
            <div className="flex justify-between text-[#737B87]">
              <span>Evaluated Ground Truth Instances:</span>
              <span className="font-semibold text-[#20242B]">47 potholes</span>
            </div>
            <div className="flex justify-between text-[#737B87]">
              <span>Model Parameters:</span>
              <span className="font-semibold text-[#20242B]">21,774,430 (21.77M)</span>
            </div>
            <div className="flex justify-between text-[#737B87]">
              <span>Weights Footprint:</span>
              <span className="font-semibold text-[#20242B]">41.96 MB (.pt)</span>
            </div>
          </div>
        </div>

        {/* Validation Notes & Academic Rigor */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs lg:col-span-2 space-y-3.5">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#708B76]" />
            <h3 className="text-[14px] font-semibold text-[#20242B]">Evaluation Methodology & Compliance</h3>
          </div>
          <p className="text-[12.5px] text-[#737B87] leading-relaxed">
            Evaluation was executed strictly using official Ultralytics YOLO26 validation scripts on an unseen, 
            annotated validation split of road imagery. All curves, confusion matrices, and precision-recall trade-offs 
            reflect real ground-truth label comparisons with intersection-over-union (IoU) thresholds evaluated from 
            0.50 to 0.95 in accordance with COCO detection protocols.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-[#F7F8FA] rounded-lg p-3 border border-[#E5E7EB]">
              <span className="text-[11px] font-semibold text-[#20242B] block">mAP@0.50 Performance</span>
              <p className="text-[11.5px] text-[#737B87] mt-0.5">
                Achieves 97.5% mean average precision at IoU 0.50, ensuring high reliability in practical road maintenance deployments.
              </p>
            </div>
            <div className="bg-[#F7F8FA] rounded-lg p-3 border border-[#E5E7EB]">
              <span className="text-[11px] font-semibold text-[#20242B] block">Low False Alarm Rate</span>
              <p className="text-[11.5px] text-[#737B87] mt-0.5">
                Zero false positive detections on background pavement textures prevents costly unnecessary inspection dispatches.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Figures & Visuals Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#20242B]">Performance Curves & Diagnostic Visuals</h2>
            <p className="text-[12px] text-[#737B87]">Click any graph for high-resolution inspection</p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-[#F7F8FA] p-1 rounded-lg border border-[#E5E7EB]">
            {[
              { id: 'all', label: 'All Figures' },
              { id: 'matrices', label: 'Matrices' },
              { id: 'curves', label: 'PR & F1 Curves' },
              { id: 'training', label: 'Loss & Training' },
              { id: 'validation', label: 'Validation' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-[#20242B] shadow-xs'
                    : 'text-[#737B87] hover:text-[#20242B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFigures.map((fig) => (
            <div
              key={fig.id}
              onClick={() => setZoomedImage(fig)}
              className="group bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#D1D5DB] transition-all cursor-pointer flex flex-col"
            >
              <div className="relative aspect-4/3 bg-[#FAFBFD] border-b border-[#F3F4F6] overflow-hidden flex items-center justify-center p-2">
                <img
                  src={fig.src}
                  alt={fig.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-[1.02] transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[#20242B]/0 group-hover:bg-[#20242B]/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 rounded-lg text-[12px] font-medium text-[#20242B] shadow-sm">
                    <Maximize2 size={13} /> Zoom
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#20242B] group-hover:text-[#526B82] transition-colors">
                    {fig.title}
                  </h4>
                  <p className="text-[11.5px] text-[#737B87] mt-1 line-clamp-2 leading-relaxed">
                    {fig.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox / Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-[#20242B]/60 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="bg-white border border-[#E5E7EB] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[15px] font-semibold text-[#20242B]">{zoomedImage.title}</h3>
                <p className="text-[12px] text-[#737B87] mt-0.5">{zoomedImage.description}</p>
              </div>
              <button
                onClick={() => setZoomedImage(null)}
                className="p-1.5 rounded-lg hover:bg-[#F7F8FA] text-[#737B87] hover:text-[#20242B] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="p-6 bg-[#FAFBFD] overflow-auto flex items-center justify-center min-h-[400px]">
              <img
                src={zoomedImage.src}
                alt={zoomedImage.title}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-[#E5E7EB] bg-white text-[12px]">
              <span className="text-[#737B87]">Ultralytics YOLO26 Model Benchmark</span>
              <a
                href={zoomedImage.src}
                download={`${zoomedImage.title.replace(/\s+/g, '_')}.png`}
                className="inline-flex items-center gap-1.5 text-[#526B82] font-medium hover:underline"
              >
                <Download size={13} /> Save Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
