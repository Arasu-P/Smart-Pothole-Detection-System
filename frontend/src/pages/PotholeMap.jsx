import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin, RefreshCw } from 'lucide-react';
import L from 'leaflet';
import { getDetections } from '../services/api';

// Fix default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createIcon = (color) => new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background:${color};width:20px;height:20px;border-radius:50%;border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.2);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const severityIcons = {
  low: createIcon('#526B82'),
  medium: createIcon('#C18A45'),
  high: createIcon('#B85C55'),
};

export default function PotholeMap() {
  const [detections, setDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDetections();
  }, [filter]);

  const fetchDetections = async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (filter !== 'all') params.severity = filter;
      const res = await getDetections(params);
      const withLocation = (res.data || []).filter(d => d.latitude && d.longitude);
      setDetections(withLocation);
    } catch (err) {
      console.error('Failed to fetch detections:', err);
    } finally {
      setLoading(false);
    }
  };

  const center = detections.length > 0
    ? [detections[0].latitude, detections[0].longitude]
    : [20, 0];
  const zoom = detections.length > 0 ? 12 : 2;

  const filters = ['all', 'low', 'medium', 'high'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[#20242B]">Pothole Map</h1>
          <p className="text-[13px] text-[#737B87] mt-1">Interactive map of detected pothole locations</p>
        </div>
        <button onClick={fetchDetections}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-[13px] text-[#737B87] hover:text-[#20242B] hover:border-[#D1D5DB] transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map(sev => (
          <button key={sev} onClick={() => setFilter(sev)}
            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
              filter === sev
                ? 'bg-[#526B82]/10 text-[#526B82] ring-1 ring-[#526B82]/20'
                : 'bg-white text-[#737B87] border border-[#E5E7EB] hover:border-[#D1D5DB]'
            }`}>
            {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
          </button>
        ))}
        <span className="flex items-center gap-1.5 text-[12px] text-[#9CA3AF] ml-2">
          <MapPin size={12} /> {detections.length} locations
        </span>
      </div>

      {/* Map */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden" style={{ height: '560px' }}>
        {detections.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-xl bg-[#F7F8FA] flex items-center justify-center mb-3">
                <MapPin className="text-[#D1D5DB]" size={24} strokeWidth={1.5} />
              </div>
              <p className="text-[13px] text-[#9CA3AF]">No geolocated detections found.</p>
              <p className="text-[12px] text-[#D1D5DB] mt-1">Upload images with GPS data or enter coordinates manually.</p>
            </div>
          </div>
        ) : (
          <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {detections.map((det) => (
              <Marker key={det.id} position={[det.latitude, det.longitude]}
                icon={severityIcons[det.severity] || severityIcons.low}>
                <Popup>
                  <div className="text-[12px] text-[#20242B] space-y-1 min-w-[160px]">
                    <p className="font-semibold">Pothole #{det.id}</p>
                    <div className="flex justify-between">
                      <span className="text-[#737B87]">Severity</span>
                      <span className={`font-medium ${
                        det.severity === 'high' ? 'text-[#B85C55]' :
                        det.severity === 'medium' ? 'text-[#C18A45]' : 'text-[#526B82]'
                      }`}>{det.severity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#737B87]">Confidence</span>
                      <span>{(det.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#737B87]">Source</span>
                      <span className="truncate max-w-[100px]">{det.source_filename || 'N/A'}</span>
                    </div>
                    <div className="text-[11px] text-[#9CA3AF] pt-1 border-t border-[#E5E7EB]">
                      {new Date(det.timestamp).toLocaleString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#526B82] border-2 border-white shadow-sm" />
          <span className="text-[12px] text-[#737B87]">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#C18A45] border-2 border-white shadow-sm" />
          <span className="text-[12px] text-[#737B87]">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-[#B85C55] border-2 border-white shadow-sm" />
          <span className="text-[12px] text-[#737B87]">High</span>
        </div>
      </div>
    </div>
  );
}
