import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, Mail, User, AlertTriangle, CheckCircle } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { register, error, setError, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    setError(null);
  }, [isAuthenticated, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMessage('');
    setError(null);

    // Simple validations
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const result = await register(username, email, password);
    if (result.success) {
      setSuccessMessage(result.message || 'Registration successful! Redirecting to login...');
      // Clear forms
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    }
  };

  return (
    <div className="auth-container">
      <div className="card auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', padding: '0.75rem', backgroundColor: '#dbeafe', borderRadius: '50%', color: '#2563eb', marginBottom: '0.75rem' }}>
            <Shield size={32} />
          </div>
          <h2 className="auth-title">Create Secure Account</h2>
          <p className="auth-subtitle">Register to upload and download encrypted files</p>
        </div>

        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle size={16} />
            <span>{successMessage}</span>
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
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className="form-input"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading || !!successMessage}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!successMessage}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || !!successMessage}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading || !!successMessage}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading || !!successMessage}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Registering...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
