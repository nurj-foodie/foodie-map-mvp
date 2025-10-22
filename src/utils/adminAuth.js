// Simple admin authentication utility
// In production, this should be more secure

const ADMIN_EMAILS = [
  process.env.REACT_APP_ADMIN_EMAIL_1,
  process.env.REACT_APP_ADMIN_EMAIL_2,
  process.env.REACT_APP_ADMIN_EMAIL_3,
  // Add more admin emails here
];

const ADMIN_PASSWORDS = [
  process.env.REACT_APP_ADMIN_PASSWORD_1,
  process.env.REACT_APP_ADMIN_PASSWORD_2,
  process.env.REACT_APP_ADMIN_PASSWORD_3,
  // Add more admin passwords here
];

export const isAdminUser = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
};

export const verifyAdminPassword = (password) => {
  return ADMIN_PASSWORDS.includes(password);
};

export const getAdminAccess = () => {
  const stored = localStorage.getItem('admin_access');
  if (!stored) return false;
  
  try {
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // Check if access is still valid (24 hours)
    if (now - data.timestamp > 24 * 60 * 60 * 1000) {
      localStorage.removeItem('admin_access');
      return false;
    }
    
    return data.granted;
  } catch (error) {
    localStorage.removeItem('admin_access');
    return false;
  }
};

export const grantAdminAccess = (password) => {
  if (verifyAdminPassword(password)) {
    const data = {
      granted: true,
      timestamp: Date.now()
    };
    localStorage.setItem('admin_access', JSON.stringify(data));
    return true;
  }
  return false;
};

export const revokeAdminAccess = () => {
  localStorage.removeItem('admin_access');
};
