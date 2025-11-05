import React, { useState } from 'react';
import { ADMIN_CONFIG, addAdmin, removeAdmin, listAdmins, updateAdminPassword } from '../config/adminConfig';
import './AdminManagement.css';

const AdminManagement = () => {
  const [admins, setAdmins] = useState(listAdmins());
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    password: '',
    role: 'admin',
    name: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleAddAdmin = (e) => {
    e.preventDefault();
    
    if (!newAdmin.email || !newAdmin.password) {
      alert('Please fill in all required fields');
      return;
    }
    
    try {
      addAdmin(newAdmin.email, newAdmin.password, newAdmin.role, newAdmin.name);
      setAdmins(listAdmins());
      setNewAdmin({ email: '', password: '', role: 'admin', name: '' });
      setShowAddForm(false);
      alert('Admin added successfully!');
    } catch (error) {
      alert('Error adding admin: ' + error.message);
    }
  };

  const handleRemoveAdmin = (email) => {
    if (window.confirm(`Are you sure you want to remove admin: ${email}?`)) {
      try {
        removeAdmin(email);
        setAdmins(listAdmins());
        alert('Admin removed successfully!');
      } catch (error) {
        alert('Error removing admin: ' + error.message);
      }
    }
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }
    
    try {
      updateAdminPassword(selectedAdmin.email, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setSelectedAdmin(null);
      alert('Password updated successfully!');
    } catch (error) {
      alert('Error updating password: ' + error.message);
    }
  };

  return (
    <div className="admin-management">
      <div className="admin-management-header">
        <h2>👥 Admin Management</h2>
        <button 
          className="add-admin-btn"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add New Admin
        </button>
      </div>

      <div className="admins-list">
        <h3>Current Admins</h3>
        {admins.length === 0 ? (
          <p className="no-admins">No admins configured</p>
        ) : (
          <div className="admins-table">
            <div className="table-header">
              <div>Email</div>
              <div>Name</div>
              <div>Role</div>
              <div>Actions</div>
            </div>
            {admins.map((admin, index) => (
              <div key={index} className="table-row">
                <div className="admin-email">{admin.email}</div>
                <div className="admin-name">{admin.name}</div>
                <div className="admin-role">
                  <span className={`role-badge ${admin.role}`}>
                    {admin.role.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="admin-actions">
                  <button 
                    className="action-btn change-password-btn"
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setShowPasswordForm(true);
                    }}
                  >
                    🔐 Change Password
                  </button>
                  <button 
                    className="action-btn remove-btn"
                    onClick={() => handleRemoveAdmin(admin.email)}
                  >
                    🗑️ Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Admin</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAdmin} className="admin-form">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  required
                  placeholder="admin@example.com"
                />
              </div>
              
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  required
                  placeholder="Secure password"
                  minLength="6"
                />
              </div>
              
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                  placeholder="Admin Name"
                />
              </div>
              
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({...newAdmin, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordForm && selectedAdmin && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password for {selectedAdmin.email}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowPasswordForm(false);
                  setSelectedAdmin(null);
                }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdatePassword} className="admin-form">
              <div className="form-group">
                <label>New Password *</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                  placeholder="New secure password"
                  minLength="6"
                />
              </div>
              
              <div className="form-group">
                <label>Confirm New Password *</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                  placeholder="Confirm new password"
                  minLength="6"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowPasswordForm(false);
                    setSelectedAdmin(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
