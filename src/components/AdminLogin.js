import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { isAdminUser, grantAdminAccess, getAdminAccess } from '../utils/adminAuth';
import './AdminLogin.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const { user } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if user already has admin access
  React.useEffect(() => {
    if (getAdminAccess()) {
      onLoginSuccess();
    }
  }, [onLoginSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if user is authorized admin
      if (!isAdminUser(user)) {
        setError('Access denied. You are not authorized to access admin features.');
        return;
      }

      // Verify password
      if (grantAdminAccess(user, password)) {
        onLoginSuccess();
      } else {
        setError('Invalid admin password.');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <h2>🔒 Admin Access Required</h2>
          <p>Please log in to your account first to access admin features.</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser(user)) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <h2>🚫 Access Denied</h2>
          <p>You are not authorized to access admin features.</p>
          <p className="user-info">Logged in as: {user.email}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <h2>🔐 Admin Login</h2>
        <p>Welcome, {user.email}</p>
        <p>Enter admin password to continue:</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="login-btn"
          >
            {loading ? 'Verifying...' : 'Access Admin Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
