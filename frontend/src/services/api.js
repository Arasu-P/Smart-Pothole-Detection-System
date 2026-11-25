import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 300000, // 5 minutes for video processing
});

// Image detection
export const detectImage = async (file, confidence = 0.25, latitude = null, longitude = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('confidence', confidence);
  if (latitude !== null) formData.append('latitude', latitude);
  if (longitude !== null) formData.append('longitude', longitude);
  
  const response = await api.post('/detect/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// Video detection
export const detectVideo = async (file, confidence = 0.25, latitude = null, longitude = null, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('confidence', confidence);
  if (latitude !== null) formData.append('latitude', latitude);
  if (longitude !== null) formData.append('longitude', longitude);
  
  const response = await api.post('/detect/video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
  });
  return response.data;
};

// Get all detections
export const getDetections = async (params = {}) => {
  const response = await api.get('/detections', { params });
  return response.data;
};

// Get single detection
export const getDetection = async (id) => {
  const response = await api.get(`/detections/${id}`);
  return response.data;
};

// Delete detection
export const deleteDetection = async (id) => {
  const response = await api.delete(`/detections/${id}`);
  return response.data;
};

// Dashboard stats
export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};

// Export detections as CSV
export const exportDetections = async (params = {}) => {
  const response = await api.get('/detections/export', { 
    params,
    responseType: 'blob',
  });
  
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `pothole_detections_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
