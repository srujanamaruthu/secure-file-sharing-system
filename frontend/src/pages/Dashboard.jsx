import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Upload, FileText, Clock, User, HardDrive, 
  Download, Trash2, Shield, AlertCircle, CheckCircle, 
  HelpCircle, ShieldCheck
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('files'); // 'files' or 'logs'
  const [files, setFiles] = useState([]);
  const [logs, setLogs] = useState([]);
  const [profileData, setProfileData] = useState(null);
  
  // Loading states
  const [filesLoading, setFilesLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // stores fileId being downloaded/deleted

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Status notifications
  const [notification, setNotification] = useState(null); // { type: 'success'|'danger', message: '' }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Fetch functions
  const fetchFiles = useCallback(async () => {
    try {
      setFilesLoading(true);
      const response = await api.get('/files');
      if (response.data.success) {
        setFiles(response.data.files);
      }
    } catch (err) {
      console.error('Error fetching files:', err.message);
      showNotification('danger', 'Failed to retrieve file list.');
    } finally {
      setFilesLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const response = await api.get('/logs');
      if (response.data.success) {
        setLogs(response.data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err.message);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true);
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        setProfileData(response.data.user);
      }
    } catch (err) {
      console.error('Error fetching profile:', err.message);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch all dashboard data
  const refreshDashboard = useCallback(() => {
    fetchFiles();
    fetchLogs();
    fetchProfile();
  }, [fetchFiles, fetchLogs, fetchProfile]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Handle Drag & Drop events
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const allowedExtensions = /\.(pdf|doc|docx|ppt|pptx|zip|jpeg|jpg|png|gif)$/i;
    if (!allowedExtensions.test(file.name)) {
      showNotification('danger', 'Unsupported file type. Only PDF, DOCX, PPT, JPG, PNG, GIF, and ZIP are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification('danger', 'File size exceeds the 10MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploading(true);
      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showNotification('success', `File "${selectedFile.name}" successfully encrypted and uploaded.`);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        refreshDashboard();
      }
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Upload failed due to network error.';
      showNotification('danger', errMsg);
    } finally {
      setUploading(false);
    }
  };

  // Decrypt and Download
  const handleDownload = async (fileId, filename) => {
    try {
      setActionLoading(fileId);
      showNotification('warning', `Requesting server decryption for "${filename}"...`);
      
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob', // Important: process binary stream
      });

      // Create a local blob URL
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create temporary link element and click it
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      showNotification('success', `File "${filename}" successfully decrypted and downloaded.`);
      fetchLogs(); // Refresh logs to display download event
    } catch (err) {
      console.error('Download decryption failed:', err.message);
      showNotification('danger', 'Access denied or decryption failed during transfer.');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete file
  const handleDelete = async (fileId, filename) => {
    if (!window.confirm(`Are you sure you want to securely delete "${filename}"? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(fileId);
      const response = await api.delete(`/files/${fileId}`);
      if (response.data.success) {
        showNotification('success', `File "${filename}" was securely deleted from server storage.`);
        refreshDashboard();
      }
    } catch (err) {
      console.error('Delete failed:', err.message);
      showNotification('danger', 'Failed to delete file.');
    } finally {
      setActionLoading(null);
    }
  };

  // Helpers
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container">
      {/* Top Banner Alert Notifications */}
      {notification && (
        <div className={`alert alert-${notification.type}`} style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000, boxShadow: 'var(--shadow-md)', maxWidth: '400px' }}>
          {notification.type === 'success' && <CheckCircle size={18} />}
          {notification.type === 'danger' && <AlertCircle size={18} />}
          {notification.type === 'warning' && <Shield size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2>User Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Securely manage your encrypted document storage</p>
        </div>
        <button className="btn btn-secondary" onClick={refreshDashboard} title="Refresh Data">
          Refresh Dashboard
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Left Column: File Manager & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ minHeight: '400px' }}>
            <div className="tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <HardDrive size={18} />
                  My Files ({files.length})
                </span>
              </button>
              <button 
                className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('logs')}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} />
                  Security Activity Audit Logs
                </span>
              </button>
            </div>

            {activeTab === 'files' && (
              <div>
                {filesLoading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading files list...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <ShieldCheck size={48} style={{ color: '#94a3b8', marginBottom: '1rem' }} />
                    <h4>No Files Uploaded Yet</h4>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>Your uploaded files will be encrypted on the fly and listed here.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Type</th>
                          <th>Size</th>
                          <th>Uploaded Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {files.map((file) => (
                          <tr key={file.id}>
                            <td style={{ fontWeight: '500' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FileText size={16} style={{ color: 'var(--text-muted)' }} />
                                {file.filename}
                              </div>
                            </td>
                            <td>{file.fileType.split('/')[1]?.toUpperCase() || file.fileType}</td>
                            <td>{formatBytes(file.size)}</td>
                            <td>{formatDate(file.uploadDate)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => handleDownload(file.id, file.filename)}
                                  disabled={actionLoading !== null}
                                  title="Download and Decrypt File"
                                >
                                  <Download size={14} />
                                  <span>Decrypt & Download</span>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(file.id, file.filename)}
                                  disabled={actionLoading !== null}
                                  title="Securely Delete File"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                {logsLoading ? (
                  <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading security logs...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                    <p>No activity logs found for your account.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Event Action</th>
                          <th>Timestamp</th>
                          <th>Origin IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id}>
                            <td style={{ fontWeight: '500' }}>
                              <span style={{ 
                                color: log.action.includes('Failed') ? 'var(--danger-color)' : 
                                       log.action.includes('Upload') ? 'var(--success-color)' :
                                       log.action.includes('Download') ? 'var(--primary-color)' : 'inherit'
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td>{formatDate(log.timestamp)}</td>
                            <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ipAddress}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Upload widget & Profile info */}
        <div className="dashboard-sidebar">
          {/* Secure File Upload Card */}
          <div className="card">
            <div className="card-header">
              <h3>Secure Upload</h3>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              <div 
                className="upload-zone"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={uploading}
                />
                <div className="upload-zone-icon">
                  <Upload size={32} style={{ margin: '0 auto' }} />
                </div>
                <p style={{ fontWeight: '500' }}>Click to Browse or Drag File Here</p>
                <span className="file-requirements">Max 10MB (PDF, DOCX, PPT, Images, ZIP)</span>
              </div>

              {selectedFile && (
                <div className="selected-file-info">
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
                    <strong>{selectedFile.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formatBytes(selectedFile.size)}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    style={{ padding: '0.25rem' }}
                    disabled={uploading}
                  >
                    Clear
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    <span>Encrypting & Storing...</span>
                  </>
                ) : (
                  <span>Encrypt & Upload</span>
                )}
              </button>
            </form>
          </div>

          {/* User Profile Card */}
          <div className="card profile-card">
            <div className="profile-avatar">
              {user?.username ? user.username.substring(0, 2).toUpperCase() : <User size={24} />}
            </div>
            <h3>{user?.username}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</p>
            
            {profileLoading ? (
              <div style={{ padding: '1rem' }}><span className="spinner"></span></div>
            ) : profileData ? (
              <div className="profile-stat-grid">
                <div className="profile-stat-item">
                  <span className="profile-stat-label">Stored Files:</span>
                  <span className="profile-stat-value">{profileData.filesCount}</span>
                </div>
                <div className="profile-stat-item">
                  <span className="profile-stat-label">Registered:</span>
                  <span className="profile-stat-value">{new Date(profileData.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="profile-stat-item" style={{ flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <span className="profile-stat-label">Last Login:</span>
                  <span className="profile-stat-value" style={{ fontSize: '0.8rem' }}>{formatDate(profileData.lastLogin)}</span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>Failed to load profile details</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
