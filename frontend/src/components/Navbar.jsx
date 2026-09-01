import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-brand">
          <Shield size={24} />
          <span>Secure File Share</span>
        </div>
        
        {isAuthenticated && user && (
          <div className="navbar-menu">
            <div className="navbar-user">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <UserIcon size={16} />
                Logged in as: <strong>{user.username}</strong>
              </span>
            </div>
            <button onClick={logout} className="btn btn-secondary btn-sm" title="Log Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
