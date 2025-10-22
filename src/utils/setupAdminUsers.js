// Setup script to create admin users in Firebase
// Run this once to set up your admin users

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

const ADMIN_USERS = [
  {
    email: process.env.REACT_APP_ADMIN_EMAIL_1,
    password: process.env.REACT_APP_ADMIN_PASSWORD_1,
    name: process.env.REACT_APP_ADMIN_NAME_1
  },
  {
    email: process.env.REACT_APP_ADMIN_EMAIL_2, 
    password: process.env.REACT_APP_ADMIN_PASSWORD_2,
    name: process.env.REACT_APP_ADMIN_NAME_2
  },
  {
    email: process.env.REACT_APP_ADMIN_EMAIL_3,
    password: process.env.REACT_APP_ADMIN_PASSWORD_3,
    name: process.env.REACT_APP_ADMIN_NAME_3
  }
];

export const setupAdminUsers = async () => {
  console.log('🚀 Setting up admin users...');
  
  for (const user of ADMIN_USERS) {
    try {
      // Try to create the user
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      console.log(`✅ Created admin user: ${user.email}`);
      
      // Sign out immediately after creation
      await auth.signOut();
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('🎉 Admin user setup completed!');
};

export const testAdminLogin = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Login successful for: ${email}`);
    await auth.signOut();
    return true;
  } catch (error) {
    console.error(`❌ Login failed for ${email}:`, error.message);
    return false;
  }
};

// Test all admin logins
export const testAllAdminLogins = async () => {
  console.log('🧪 Testing all admin logins...');
  
  for (const user of ADMIN_USERS) {
    await testAdminLogin(user.email, user.password);
  }
  
  console.log('🎉 Admin login testing completed!');
};

// Uncomment the line below and run this file to create admin users
// setupAdminUsers();
