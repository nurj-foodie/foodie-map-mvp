// Admin Authentication Utilities
// Basic admin authentication functions

/**
 * Check if a user is an admin
 * @param {string} email - User's email address
 * @returns {boolean} - True if user is admin
 */
export const isAdminUser = (user) => {
  if (!user) return false;
  
  // Extract email from user object (could be User object or email string)
  const email = user.email || user;
  
  if (!email) return false;
  
  // Get admin emails from environment variables
  const adminEmails = [
    process.env.REACT_APP_ADMIN_EMAIL_1,
    process.env.REACT_APP_ADMIN_EMAIL_2,
    process.env.REACT_APP_ADMIN_EMAIL_3
  ].filter(Boolean); // Remove undefined values
  
  return adminEmails.includes(email);
};

/**
 * Get admin access level for a user
 * @param {string} email - User's email address
 * @returns {string|null} - Admin role or null if not admin
 */
export const getAdminAccess = (user) => {
  if (!user) return null;
  
  // Extract email from user object (could be User object or email string)
  const email = user.email || user;
  
  if (!email) return null;
  
  // Check each admin email and return corresponding role
  if (email === process.env.REACT_APP_ADMIN_EMAIL_1) {
    return process.env.REACT_APP_ADMIN_ROLE_1 || 'admin';
  }
  if (email === process.env.REACT_APP_ADMIN_EMAIL_2) {
    return process.env.REACT_APP_ADMIN_ROLE_2 || 'admin';
  }
  if (email === process.env.REACT_APP_ADMIN_EMAIL_3) {
    return process.env.REACT_APP_ADMIN_ROLE_3 || 'admin';
  }
  
  return null;
};

/**
 * Get admin name for a user
 * @param {string} email - User's email address
 * @returns {string|null} - Admin name or null if not admin
 */
export const getAdminName = (email) => {
  if (!email) return null;
  
  if (email === process.env.REACT_APP_ADMIN_EMAIL_1) {
    return process.env.REACT_APP_ADMIN_NAME_1 || 'Admin';
  }
  if (email === process.env.REACT_APP_ADMIN_EMAIL_2) {
    return process.env.REACT_APP_ADMIN_NAME_2 || 'Admin';
  }
  if (email === process.env.REACT_APP_ADMIN_EMAIL_3) {
    return process.env.REACT_APP_ADMIN_NAME_3 || 'Admin';
  }
  
  return null;
};

/**
 * Check if user has specific admin role
 * @param {string} email - User's email address
 * @param {string} role - Required role (e.g., 'founder', 'admin')
 * @returns {boolean} - True if user has the role
 */
export const hasAdminRole = (email, role) => {
  const userRole = getAdminAccess(email);
  return userRole === role;
};

/**
 * Get all admin users
 * @returns {Array} - Array of admin user objects
 */
export const getAllAdminUsers = () => {
  const admins = [];
  
  if (process.env.REACT_APP_ADMIN_EMAIL_1) {
    admins.push({
      email: process.env.REACT_APP_ADMIN_EMAIL_1,
      name: process.env.REACT_APP_ADMIN_NAME_1 || 'Admin',
      role: process.env.REACT_APP_ADMIN_ROLE_1 || 'admin'
    });
  }
  
  if (process.env.REACT_APP_ADMIN_EMAIL_2) {
    admins.push({
      email: process.env.REACT_APP_ADMIN_EMAIL_2,
      name: process.env.REACT_APP_ADMIN_NAME_2 || 'Admin',
      role: process.env.REACT_APP_ADMIN_ROLE_2 || 'admin'
    });
  }
  
  if (process.env.REACT_APP_ADMIN_EMAIL_3) {
    admins.push({
      email: process.env.REACT_APP_ADMIN_EMAIL_3,
      name: process.env.REACT_APP_ADMIN_NAME_3 || 'Admin',
      role: process.env.REACT_APP_ADMIN_ROLE_3 || 'admin'
    });
  }
  
  return admins;
};

/**
 * Grant admin access (verify admin password)
 * @param {object} user - User object with email
 * @param {string} password - Admin password to verify
 * @returns {boolean} - True if password matches admin password
 */
export const grantAdminAccess = (user, password) => {
  if (!user || !password) return false;
  
  // Extract email from user object
  const email = user.email || user;
  
  // Check password against environment variables
  if (email === process.env.REACT_APP_ADMIN_EMAIL_1) {
    return password === process.env.REACT_APP_ADMIN_PASSWORD_1;
  }
  if (email === process.env.REACT_APP_ADMIN_EMAIL_2) {
    return password === process.env.REACT_APP_ADMIN_PASSWORD_2;
  }
  if (email === process.env.REACT_APP_ADMIN_EMAIL_3) {
    return password === process.env.REACT_APP_ADMIN_PASSWORD_3;
  }
  
  return false;
};

/**
 * Revoke admin access (placeholder function)
 * @param {string} email - User's email address
 * @returns {boolean} - Always returns false (not implemented)
 */
export const revokeAdminAccess = (email) => {
  console.log('revokeAdminAccess called for:', email);
  // This would typically update a database
  // For now, just return false as it's not implemented
  return false;
};
