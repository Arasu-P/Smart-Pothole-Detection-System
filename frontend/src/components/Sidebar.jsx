import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ImagePlus, Video, Camera,
  MapPin, Clock, Settings, BarChart3,
  ChevronLeft, ChevronRight, AlertTriangle
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/image-detection', icon: ImagePlus, label: 'Image Detection' },
  { path: '/video-detection', icon: Video, label: 'Video Detection' },
  { path: '/live-detection', icon: Camera, label: 'Live Detection' },
  { path: '/map', icon: MapPin, label: 'Pothole Map' },
  { path: '/history', icon: Clock, label: 'Detection History' },
  { path: '/metrics', icon: BarChart3, label: 'Model Metrics' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-[#E5E7EB] z-50 transition-all duration-300 ${
        isOpen ? 'w-60' : 'w-[68px]'
      } flex flex-col`}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 h-16 border-b border-[#E5E7EB] ${isOpen ? 'px-5' : 'px-4 justify-center'}`}>
        {isOpen ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#526B82] flex items-center justify-center shrink-0">
              <AlertTriangle size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[13px] font-semibold text-[#20242B] leading-tight truncate">
                Pothole Detection
              </h1>
              <p className="text-[10px] text-[#737B87] font-medium">YOLO26 System</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-[#526B82] flex items-center justify-center">
            <AlertTriangle size={16} className="text-white" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group ${
                isActive
                  ? 'bg-[#526B82]/8 text-[#526B82] font-medium'
                  : 'text-[#737B87] hover:bg-[#F7F8FA] hover:text-[#20242B]'
              } ${!isOpen ? 'justify-center' : ''}`}
              title={!isOpen ? label : undefined}
            >
              <Icon
                size={18}
                strokeWidth={isActive ? 2 : 1.75}
                className="shrink-0"
              />
              {isOpen && (
                <span className="text-[13px] truncate">{label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-[#E5E7EB] p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[#737B87] hover:bg-[#F7F8FA] hover:text-[#20242B] transition-colors text-[13px]"
        >
          {isOpen ? (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      </div>
    </aside>
  );
}
