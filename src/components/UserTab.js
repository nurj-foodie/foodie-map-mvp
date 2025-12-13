import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from './AuthForm';
import UserDashboard from './UserDashboard';
import './UserTab.css';

const UserTab = () => {
  const { user, loading } = useAuth();
  const userTabRef = useRef(null);

  // Scroll to top when component mounts or user changes
  useEffect(() => {
    if (userTabRef.current) {
      userTabRef.current.scrollTop = 0;
    }
  }, [user]);

  if (loading) {
    return (
      <div className="user-tab">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-tab" ref={userTabRef}>
      {!user ? (
        <div className="login-section">
          <div className="login-welcome">
            <h2>👤 Welcome to Foodie Map</h2>
            <p>Sign in to save your favorites, create routes, and track your foodie journey!</p>
          </div>
          <AuthForm />
        </div>
      ) : (
        <UserDashboard />
      )}
    </div>
  );
};

export default UserTab;
