// Admin configuration file
// Update these values with your actual admin credentials

export const ADMIN_CONFIG = {
  // Admin users - loaded from environment variables
  // DO NOT hardcode credentials here! Use .env file instead.
  admins: [
    {
      email: process.env.REACT_APP_ADMIN_EMAIL_1 || "admin1@example.com",
      password: process.env.REACT_APP_ADMIN_PASSWORD_1 || "",
      role: process.env.REACT_APP_ADMIN_ROLE_1 || "admin",
      name: process.env.REACT_APP_ADMIN_NAME_1 || "Admin 1"
    },
    {
      email: process.env.REACT_APP_ADMIN_EMAIL_2 || "admin2@example.com",
      password: process.env.REACT_APP_ADMIN_PASSWORD_2 || "",
      role: process.env.REACT_APP_ADMIN_ROLE_2 || "admin",
      name: process.env.REACT_APP_ADMIN_NAME_2 || "Admin 2"
    },
    {
      email: process.env.REACT_APP_ADMIN_EMAIL_3 || "admin3@example.com",
      password: process.env.REACT_APP_ADMIN_PASSWORD_3 || "",
      role: process.env.REACT_APP_ADMIN_ROLE_3 || "admin",
      name: process.env.REACT_APP_ADMIN_NAME_3 || "Admin 3"
    }
  ].filter(admin => admin.email && admin.email !== "admin1@example.com"), // Filter out placeholder emails
  
  // Security settings
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  
  // Features
  enableLoginAttempts: true,
  enableSessionTimeout: true,
  enableRoleBasedAccess: true
};

// Helper functions
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

export const listAdmins = () => {
  return ADMIN_CONFIG.admins.map(admin => ({
    email: admin.email,
    role: admin.role,
    name: admin.name
    // Don't return password for security
  }));
};

export const updateAdminPassword = (email, newPassword) => {
  const admin = ADMIN_CONFIG.admins.find(admin => 
    admin.email.toLowerCase() === email.toLowerCase()
  );
  
  if (admin) {
    admin.password = newPassword;
    console.log(`🔐 Password updated for ${email}`);
    return true;
  }
  
  return false;
};
