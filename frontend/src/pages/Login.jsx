import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);
  
  const { login, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Check if session expired query parameter is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === 'true') {
      setSessionExpiredMsg(true);
    }
    // Clear global error state when loading page
    setError(null);
  }, [location, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSessionExpiredMsg(false);

    if (!identity.trim()) {
      setValidationError('Please enter your username or email address.');
      return;
    }

    if (!password) {
      setValidationError('Please enter your password.');
      return;
    }

    const result = await login(identity, password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '50%', color: '#2563eb', marginBottom: '0.75rem' }}>
            <Shield size={32} />
          </div>
          <h2 className="auth-title">Secure Portal Login</h2>
          <p className="auth-subtitle">Enter your credentials to access files</p>
        </div>

        {sessionExpiredMsg && (
          <div className="alert alert-warning">
            <AlertTriangle size={16} />
            <span>Session expired. Please log in again.</span>
          </div>
        )}

        {(validationError || error) && (
          <div className="alert alert-danger">
            <AlertTriangle size={16} />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="identity">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input
                id="identity"
                type="text"
                className="form-input"
                placeholder="Enter username or email"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Verifying...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
