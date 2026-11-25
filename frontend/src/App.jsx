import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ImageDetection from './pages/ImageDetection';
import VideoDetection from './pages/VideoDetection';
import LiveDetection from './pages/LiveDetection';
import PotholeMap from './pages/PotholeMap';
import DetectionHistory from './pages/DetectionHistory';
import Settings from './pages/Settings';
import PerformanceMetrics from './pages/PerformanceMetrics';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
          },
        }}
      />
      <div className="flex min-h-screen bg-[#F7F8FA]">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main
          className={`flex-1 overflow-y-auto transition-all duration-300 ${
            sidebarOpen ? 'ml-60' : 'ml-[68px]'
          }`}
        >
          <div className="max-w-[1400px] mx-auto px-6 py-6 lg:px-8 lg:py-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/image-detection" element={<ImageDetection />} />
              <Route path="/video-detection" element={<VideoDetection />} />
              <Route path="/live-detection" element={<LiveDetection />} />
              <Route path="/map" element={<PotholeMap />} />
              <Route path="/history" element={<DetectionHistory />} />
              <Route path="/metrics" element={<PerformanceMetrics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
