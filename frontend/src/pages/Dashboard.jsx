import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Image, Video, MapPin, Activity, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats } from '../services/api';

const SEVERITY_COLORS = { Low: '#526B82', Medium: '#C18A45', High: '#B85C55' };

function MetricCard({ icon: Icon, title, value, subtitle, accent = '#526B82' }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 animate-fadeIn hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}10` }}>
          <Icon size={18} style={{ color: accent }} strokeWidth={1.75} />
        </div>
        <span className="text-2xl font-semibold text-[#20242B] tabular-nums">{value}</span>
      </div>
      <h3 className="text-[13px] font-medium text-[#737B87]">{title}</h3>
      {subtitle && <p className="text-[11px] text-[#9CA3AF] mt-0.5">{subtitle}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 shadow-sm text-[12px]">
      <p className="font-medium text-[#20242B]">{label || payload[0]?.name}</p>
      <p className="text-[#737B87]">{payload[0]?.value} detections</p>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getDashboardStats();
      setStats(res.data);
    } catch (err) {
      setError('Failed to load dashboard stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton h-7 w-64 mb-2" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="skeleton h-72 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-8 text-center">
        <AlertTriangle className="mx-auto text-[#B85C55] mb-3" size={32} strokeWidth={1.5} />
        <p className="text-[#B85C55] text-sm font-medium mb-3">{error}</p>
        <button onClick={fetchStats} className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-medium text-[#526B82] bg-[#526B82]/8 rounded-lg hover:bg-[#526B82]/12 transition-colors">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const severityData = stats?.severity_distribution || [];
  const recentDetections = stats?.recent_detections || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#20242B]">Road Monitoring Dashboard</h1>
        <p className="text-[13px] text-[#737B87] mt-1">Smart Pothole Detection System — YOLO26 AI</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={AlertTriangle} title="Total Potholes" value={stats?.total_detections || 0} accent="#526B82" />
        <MetricCard icon={TrendingUp} title="High Severity" value={stats?.high_severity_count || 0} subtitle="Urgent repairs needed" accent="#B85C55" />
        <MetricCard icon={Image} title="Images Processed" value={stats?.images_processed || 0} accent="#526B82" />
        <MetricCard icon={Video} title="Videos Processed" value={stats?.videos_processed || 0} accent="#708B76" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Pie */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-[#20242B] mb-4">Severity Distribution</h2>
          {severityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={62} outerRadius={96} dataKey="value" stroke="none"
                  label={({ name, value }) => `${name}: ${value}`} labelLine={{ stroke: '#CBD5E1', strokeWidth: 1 }}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-[#9CA3AF]">
              <p className="text-[13px]">No detection data yet</p>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
          <h2 className="text-[14px] font-semibold text-[#20242B] mb-4">Severity Overview</h2>
          {severityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={severityData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={{ stroke: '#E5E7EB' }} />
                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-[#9CA3AF]">
              <p className="text-[13px]">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard icon={Activity} title="Average Confidence" value={`${((stats?.average_confidence || 0) * 100).toFixed(1)}%`} accent="#526B82" />
        <MetricCard icon={MapPin} title="With GPS Location" value={stats?.detections_with_location || 0} accent="#708B76" />
        <MetricCard icon={AlertTriangle} title="Medium Severity" value={stats?.medium_severity_count || 0} accent="#C18A45" />
      </div>

      {/* Recent Detections Table */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl">
        <div className="px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-[14px] font-semibold text-[#20242B]">Recent Detections</h2>
        </div>
        {recentDetections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[#737B87] border-b border-[#E5E7EB] bg-[#F7F8FA]">
                  <th className="text-left py-3 px-6 font-medium">ID</th>
                  <th className="text-left py-3 px-6 font-medium">Timestamp</th>
                  <th className="text-left py-3 px-6 font-medium">Source</th>
                  <th className="text-left py-3 px-6 font-medium">Severity</th>
                  <th className="text-left py-3 px-6 font-medium">Confidence</th>
                  <th className="text-left py-3 px-6 font-medium">Location</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((det) => (
                  <tr key={det.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-3 px-6 text-[#20242B] font-medium">#{det.id}</td>
                    <td className="py-3 px-6 text-[#737B87] whitespace-nowrap">{new Date(det.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-6 text-[#737B87]">{det.source_type}</td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        det.severity === 'high' ? 'bg-[#B85C55]/10 text-[#B85C55]' :
                        det.severity === 'medium' ? 'bg-[#C18A45]/10 text-[#C18A45]' :
                        det.severity === 'low' ? 'bg-[#526B82]/10 text-[#526B82]' :
                        'bg-[#94A3B8]/10 text-[#94A3B8]'
                      }`}>
                        {det.severity}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-[#20242B] tabular-nums">{(det.confidence * 100).toFixed(1)}%</td>
                    <td className="py-3 px-6 text-[#737B87]">
                      {det.latitude && det.longitude ? `${det.latitude.toFixed(4)}, ${det.longitude.toFixed(4)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <AlertTriangle className="mx-auto text-[#D1D5DB] mb-2" size={28} strokeWidth={1.5} />
            <p className="text-[13px] text-[#9CA3AF]">No detections yet. Upload an image or video to start.</p>
          </div>
        )}
      </div>
    </div>
  );
}
