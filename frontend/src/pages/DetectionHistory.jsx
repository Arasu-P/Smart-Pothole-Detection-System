import React, { useState, useEffect } from 'react';
import { 
  Search, Trash2, Download, Eye, X, ChevronLeft, ChevronRight, 
  Filter, Calendar, MapPin, AlertTriangle, RefreshCw, FileText
} from 'lucide-react';
import { getDetections, deleteDetection, exportDetections } from '../services/api';
import { toast } from 'sonner';

export default function DetectionHistory() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severity, setSeverity] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const limit = 15;

  useEffect(() => {
    fetchDetections();
  }, [severity, startDate, endDate, page]);

  const fetchDetections = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { limit, offset: page * limit };
      if (severity !== 'all') params.severity = severity;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await getDetections(params);
      setDetections(res.data || []);
    } catch (err) {
      setError('Failed to load detection records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to permanently delete detection record #${id}?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteDetection(id);
      setDetections((prev) => prev.filter((d) => d.id !== id));
      toast.success(`Record #${id} deleted`);
      if (selectedDetection?.id === id) {
        setSelectedDetection(null);
      }
    } catch (err) {
      toast.error('Failed to delete detection');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (severity !== 'all') params.severity = severity;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      await exportDetections(params);
      toast.success('Detections exported to CSV');
    } catch (err) {
      toast.error('Export failed. Ensure there are records to export.');
    } finally {
      setExporting(false);
    }
  };

  const resetFilters = () => {
    setSeverity('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const severityBadgeClass = (sev) => {
    switch (sev) {
      case 'high':
        return 'bg-[#B85C55]/10 text-[#B85C55] ring-1 ring-[#B85C55]/20';
      case 'medium':
        return 'bg-[#C18A45]/10 text-[#C18A45] ring-1 ring-[#C18A45]/20';
      case 'low':
        return 'bg-[#526B82]/10 text-[#526B82] ring-1 ring-[#526B82]/20';
      default:
        return 'bg-[#94A3B8]/10 text-[#737B87] ring-1 ring-[#E5E7EB]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#20242B]">Detection History</h1>
          <p className="text-[13px] text-[#737B87] mt-1">Audit log of all detected road anomalies and metadata</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] text-[#20242B] text-[13px] font-medium rounded-lg hover:border-[#D1D5DB] transition-all disabled:opacity-50 shadow-xs"
        >
          <Download size={14} className="text-[#526B82]" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[12px] text-[#737B87] mr-1">
            <Filter size={14} />
            <span className="font-medium">Filter by:</span>
          </div>

          {/* Severity selector */}
          <div className="min-w-[130px]">
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(0); }}
              className="w-full px-3 py-1.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg text-[13px] text-[#20242B] focus:border-[#526B82] focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="high">High Severity</option>
              <option value="medium">Medium Severity</option>
              <option value="low">Low Severity</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="flex items-center gap-1.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
            <Calendar size={13} className="text-[#737B87]" />
            <span className="text-[11px] text-[#737B87]">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
              className="bg-transparent border-0 text-[12px] text-[#20242B] focus:outline-none"
            />
          </div>

          {/* End Date */}
          <div className="flex items-center gap-1.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
            <Calendar size={13} className="text-[#737B87]" />
            <span className="text-[11px] text-[#737B87]">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
              className="bg-transparent border-0 text-[12px] text-[#20242B] focus:outline-none"
            />
          </div>

          {(severity !== 'all' || startDate || endDate) && (
            <button
              onClick={resetFilters}
              className="text-[12px] text-[#526B82] hover:text-[#20242B] font-medium px-2 py-1 transition-colors"
            >
              Clear filters
            </button>
          )}

          <div className="ml-auto">
            <button
              onClick={fetchDetections}
              className="p-1.5 text-[#737B87] hover:text-[#20242B] rounded-lg hover:bg-[#F7F8FA] transition-colors"
              title="Refresh records"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-10 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto text-[#B85C55] mb-2" size={24} />
            <p className="text-[13px] text-[#B85C55] font-medium">{error}</p>
            <button
              onClick={fetchDetections}
              className="mt-3 text-[12px] text-[#526B82] font-medium hover:underline"
            >
              Try again
            </button>
          </div>
        ) : detections.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="mx-auto text-[#CBD5E1] mb-2" size={32} strokeWidth={1.5} />
            <p className="text-[14px] font-medium text-[#20242B]">No records found</p>
            <p className="text-[12px] text-[#737B87] mt-1">Try relaxing your filter parameters or upload new footage.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[#737B87] border-b border-[#E5E7EB] bg-[#F7F8FA]">
                  <th className="text-left py-3 px-5 font-medium">Record</th>
                  <th className="text-left py-3 px-5 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-5 font-medium">Source</th>
                  <th className="text-left py-3 px-5 font-medium">Type</th>
                  <th className="text-left py-3 px-5 font-medium">Severity</th>
                  <th className="text-left py-3 px-5 font-medium">Confidence</th>
                  <th className="text-left py-3 px-5 font-medium">Coordinates</th>
                  <th className="text-left py-3 px-5 font-medium">Potholes</th>
                  <th className="text-right py-3 px-5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {detections.map((det) => (
                  <tr key={det.id} className="hover:bg-[#F7F8FA]/70 transition-colors">
                    <td className="py-3 px-5 font-medium text-[#20242B]">#{det.id}</td>
                    <td className="py-3 px-5 text-[#737B87] whitespace-nowrap">
                      {new Date(det.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-5 text-[#20242B] max-w-[180px] truncate" title={det.source_filename}>
                      {det.source_filename || 'Direct Feed'}
                    </td>
                    <td className="py-3 px-5">
                      <span className="inline-block text-[11px] font-medium uppercase tracking-wider text-[#737B87] bg-[#F7F8FA] border border-[#E5E7EB] px-1.5 py-0.5 rounded">
                        {det.source_type}
                      </span>
                    </td>
                    <td className="py-3 px-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${severityBadgeClass(det.severity)}`}>
                        {det.severity}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-[#20242B] tabular-nums font-medium">
                      {(det.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-5 text-[#737B87] tabular-nums">
                      {det.latitude && det.longitude ? (
                        <span className="flex items-center gap-1 text-[12px]">
                          <MapPin size={11} className="text-[#708B76]" />
                          {det.latitude.toFixed(4)}, {det.longitude.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-[#CBD5E1]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-5 text-[#20242B] tabular-nums">
                      {det.pothole_count || 1}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedDetection(det)}
                          className="p-1.5 rounded-md hover:bg-[#F7F8FA] text-[#737B87] hover:text-[#526B82] transition-colors"
                          title="Inspect details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(det.id)}
                          disabled={deletingId === det.id}
                          className="p-1.5 rounded-md hover:bg-[#B85C55]/10 text-[#737B87] hover:text-[#B85C55] transition-colors disabled:opacity-50"
                          title="Delete entry"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E5E7EB] bg-[#FAFBFD] text-[12px] text-[#737B87]">
          <span>Page {page + 1}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#20242B] hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={detections.length < limit || loading}
              className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#20242B] hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedDetection && (
        <div 
          className="fixed inset-0 bg-[#20242B]/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedDetection(null)}
        >
          <div 
            className="bg-white border border-[#E5E7EB] rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#526B82]" />
                <h3 className="text-[15px] font-semibold text-[#20242B]">
                  Detection Record #{selectedDetection.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDetection(null)}
                className="p-1.5 rounded-lg hover:bg-[#F7F8FA] text-[#737B87] hover:text-[#20242B] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {selectedDetection.output_filename && (
                <div className="rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F7F8FA]">
                  <img
                    src={`/outputs/${selectedDetection.output_filename}`}
                    alt="Pothole detection visual"
                    className="w-full object-contain max-h-72"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-[13px]">
                <div className="bg-[#F7F8FA] rounded-lg p-3">
                  <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Timestamp</span>
                  <p className="text-[#20242B] font-medium mt-0.5">
                    {new Date(selectedDetection.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#F7F8FA] rounded-lg p-3">
                  <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Severity</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${severityBadgeClass(selectedDetection.severity)}`}>
                      {selectedDetection.severity}
                    </span>
                  </div>
                </div>

                <div className="bg-[#F7F8FA] rounded-lg p-3">
                  <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Confidence Score</span>
                  <p className="text-[#20242B] font-medium mt-0.5">
                    {(selectedDetection.confidence * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="bg-[#F7F8FA] rounded-lg p-3">
                  <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Potholes Detected</span>
                  <p className="text-[#20242B] font-medium mt-0.5">
                    {selectedDetection.pothole_count || 1}
                  </p>
                </div>

                <div className="bg-[#F7F8FA] rounded-lg p-3 col-span-2">
                  <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Source File & Type</span>
                  <p className="text-[#20242B] font-medium mt-0.5 truncate">
                    {selectedDetection.source_filename || 'Direct Stream'} ({selectedDetection.source_type})
                  </p>
                </div>

                {selectedDetection.latitude && selectedDetection.longitude && (
                  <div className="bg-[#F7F8FA] rounded-lg p-3 col-span-2">
                    <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Geographic Coordinates</span>
                    <p className="text-[#20242B] font-mono text-[12px] mt-0.5">
                      Lat: {selectedDetection.latitude.toFixed(6)}, Lon: {selectedDetection.longitude.toFixed(6)}
                    </p>
                  </div>
                )}

                {selectedDetection.bbox_x1 != null && (
                  <div className="bg-[#F7F8FA] rounded-lg p-3 col-span-2">
                    <span className="text-[11px] text-[#737B87] uppercase tracking-wider block font-medium">Bounding Box ROI</span>
                    <p className="text-[#20242B] font-mono text-[12px] mt-0.5">
                      [{selectedDetection.bbox_x1.toFixed(0)}, {selectedDetection.bbox_y1.toFixed(0)}] → [{selectedDetection.bbox_x2.toFixed(0)}, {selectedDetection.bbox_y2.toFixed(0)}]
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#E5E7EB] bg-[#FAFBFD]">
              <button
                onClick={() => handleDelete(selectedDetection.id)}
                className="text-[12px] text-[#B85C55] font-medium hover:underline inline-flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete Record
              </button>
              <button
                onClick={() => setSelectedDetection(null)}
                className="px-4 py-1.5 bg-white border border-[#E5E7EB] text-[#20242B] text-[13px] font-medium rounded-lg hover:bg-[#F7F8FA] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
