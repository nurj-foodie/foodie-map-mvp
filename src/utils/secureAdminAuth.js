// Enhanced admin authentication with better security
// This is more secure than the simple version

// Admin configuration - MUST use environment variables
// DO NOT hardcode credentials here! Use .env file instead.
const ADMIN_CONFIG = {
  // Admin users loaded from environment variables
  admins: [
    {
      email: process.env.REACT_APP_ADMIN_EMAIL_1 || 'admin1@example.com',
      password: process.env.REACT_APP_ADMIN_PASSWORD_1 || '',
      role: process.env.REACT_APP_ADMIN_ROLE_1 || 'admin',
      name: process.env.REACT_APP_ADMIN_NAME_1 || 'Admin 1'
    },
    {
      email: process.env.REACT_APP_ADMIN_EMAIL_2 || 'admin2@example.com',
      password: process.env.REACT_APP_ADMIN_PASSWORD_2 || '',
      role: process.env.REACT_APP_ADMIN_ROLE_2 || 'admin',
      name: process.env.REACT_APP_ADMIN_NAME_2 || 'Admin 2'
    },
    {
      email: process.env.REACT_APP_ADMIN_EMAIL_3 || 'admin3@example.com',
      password: process.env.REACT_APP_ADMIN_PASSWORD_3 || '',
      role: process.env.REACT_APP_ADMIN_ROLE_3 || 'admin',
      name: process.env.REACT_APP_ADMIN_NAME_3 || 'Admin 3'
    }
  ].filter(admin => admin.email && admin.email !== 'admin1@example.com'), // Filter out placeholder emails
  
  // Security settings
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// Track login attempts
const loginAttempts = new Map();

export const isAdminUser = (user) => {
  if (!user || !user.email) return false;
  return ADMIN_CONFIG.admins.some(admin => 
    admin.email.toLowerCase() === user.email.toLowerCase()
  );
};

export const getAdminInfo = (user) => {
  if (!user || !user.email) return null;
  return ADMIN_CONFIG.admins.find(admin => 
    admin.email.toLowerCase() === user.email.toLowerCase()
  );
};

export const verifyAdminPassword = (user, password) => {
  if (!user || !user.email) return false;
  
  const admin = getAdminInfo(user);
  if (!admin) return false;
  
  // Check for account lockout
  const attempts = loginAttempts.get(user.email) || { count: 0, lastAttempt: 0 };
  const now = Date.now();
  
  if (attempts.count >= ADMIN_CONFIG.maxLoginAttempts) {
    if (now - attempts.lastAttempt < ADMIN_CONFIG.lockoutDuration) {
      console.log(`🚫 Account locked for ${user.email}. Try again in ${Math.ceil((ADMIN_CONFIG.lockoutDuration - (now - attempts.lastAttempt)) / 60000)} minutes.`);
      return false;
    } else {
      // Reset attempts after lockout period
      loginAttempts.delete(user.email);
    }
  }
  
  const isValid = admin.password === password;
  
  if (!isValid) {
    // Track failed attempt
    const newAttempts = {
      count: attempts.count + 1,
      lastAttempt: now
    };
    loginAttempts.set(user.email, newAttempts);
    
    console.log(`❌ Failed login attempt for ${user.email}. Attempts: ${newAttempts.count}/${ADMIN_CONFIG.maxLoginAttempts}`);
    return false;
  } else {
    // Clear attempts on successful login
    loginAttempts.delete(user.email);
    return true;
  }
};

export const getAdminAccess = () => {
  const stored = localStorage.getItem('admin_access');
  if (!stored) return false;
  
  try {
    const data = JSON.parse(stored);
    const now = Date.now();
    
    // Check if access is still valid
    if (now - data.timestamp > ADMIN_CONFIG.sessionTimeout) {
      localStorage.removeItem('admin_access');
      return false;
    }
    
    return data.granted;
  } catch (error) {
    localStorage.removeItem('admin_access');
    return false;
  }
};

export const grantAdminAccess = (user, password) => {
  if (verifyAdminPassword(user, password)) {
    const adminInfo = getAdminInfo(user);
    const data = {
      granted: true,
      timestamp: Date.now(),
      user: {
        email: user.email,
        name: adminInfo.name,
        role: adminInfo.role
      }
    };
    localStorage.setItem('admin_access', JSON.stringify(data));
    console.log(`✅ Admin access granted to ${user.email} (${adminInfo.role})`);
    return true;
  }
  return false;
};

export const revokeAdminAccess = () => {
  localStorage.removeItem('admin_access');
  console.log('🚪 Admin access revoked');
};

export const getCurrentAdminInfo = () => {
  const stored = localStorage.getItem('admin_access');
  if (!stored) return null;
  
  try {
    const data = JSON.parse(stored);
    const now = Date.now();
    
    if (now - data.timestamp > ADMIN_CONFIG.sessionTimeout) {
      localStorage.removeItem('admin_access');
      return null;
    }
    
    return data.user;
  } catch (error) {
    localStorage.removeItem('admin_access');
    return null;
  }
};

// Utility function to add new admin (for development)
export const addAdmin = (email, password, role = 'admin', name = '') => {
  const newAdmin = {
    email: email.toLowerCase(),
    password,
    role,
    name: name || email.split('@')[0]
  };
  
  ADMIN_CONFIG.admins.push(newAdmin);
  console.log(`👤 New admin added: ${email} (${role})`);
  return newAdmin;
};

// Utility function to remove admin
export const removeAdmin = (email) => {
  const index = ADMIN_CONFIG.admins.findIndex(admin => 
    admin.email.toLowerCase() === email.toLowerCase()
  );
  
  if (index !== -1) {
    const removed = ADMIN_CONFIG.admins.splice(index, 1)[0];
    console.log(`🗑️ Admin removed: ${email}`);
    return removed;
  }
  
  return null;
};

// Utility function to list all admins
export const listAdmins = () => {
  return ADMIN_CONFIG.admins.map(admin => ({
    email: admin.email,
    role: admin.role,
    name: admin.name
    // Don't return password for security
  }));
};
