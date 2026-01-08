// Import Firebase configs
import { FIREBASE_CONFIG_ADMIN_AUTH, FIREBASE_CONFIG_REPORTS } from './api-keys.js';

// Firebase Configuration - civic-auth-a76ac (Google Auth Enabled)
const firebaseConfig = FIREBASE_CONFIG_ADMIN_AUTH;

// Initialize Firebase
let auth;
let db;
let reportsDb;

if (typeof firebase !== 'undefined' && firebase.initializeApp) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  } catch (e) {
    console.log('Firebase already initialized');
  }

  auth = firebase.auth();
  db = firebase.firestore();

  // Enable Google as sign-in provider
  auth.languageCode = 'en';

  console.log('Firebase initialized for civic-auth-a76ac with Google Auth');
} else {
  console.error('Firebase SDK not loaded');
}

// Initialize auth provider for reports database if needed
const reportsConfig = FIREBASE_CONFIG_REPORTS;

// Google Sign-In Handler for Admin Login Page
(function () {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'admin-login-new.html') return;

  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const loadingSpinner = document.getElementById('loadingSpinner');

  if (!googleSignInBtn) return;

  googleSignInBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    try {
      loadingSpinner.style.display = 'block';
      googleSignInBtn.disabled = true;

      // Create Google auth provider
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      // Perform sign-in
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      // Check if email is whitelisted
      if (typeof isAdminWhitelisted !== 'function') {
        throw new Error('Admin whitelist function not loaded. Ensure admin-list.js is included.');
      }

      if (!isAdminWhitelisted(user.email)) {
        // Not whitelisted - logout and show error
        await auth.signOut();
        alert('❌ Access Denied! Your email is not authorized as an admin.\n\nOnly whitelisted admins can access this portal.');
        loadingSpinner.style.display = 'none';
        googleSignInBtn.disabled = false;
        return;
      }

      // Admin is whitelisted - save to localStorage
      const adminData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Admin',
        photoURL: user.photoURL,
        loginTime: new Date().toISOString(),
        provider: 'google'
      };

      localStorage.setItem('currentAdmin', JSON.stringify(adminData));
      localStorage.setItem('adminAuthToken', user.getIdToken().then(token => token));

      console.log('✅ Admin authenticated and whitelisted:', adminData);

      alert('✅ Login successful! Welcome, ' + (user.displayName || user.email));

      setTimeout(() => {
        window.location.href = 'admin-dashboard-new.html';
      }, 800);

    } catch (error) {
      loadingSpinner.style.display = 'none';
      googleSignInBtn.disabled = false;

      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup closed by user');
      } else if (error.code === 'auth/popup-blocked') {
        alert('⚠️ Sign-in popup was blocked. Please allow popups for this site.');
      } else {
        console.error('Google Sign-In Error:', error);
        alert('❌ Login Error: ' + error.message);
      }
    }
  });
})();

// Check admin on dashboard page
(function () {
  const page = window.location.pathname.split('/').pop();
  if (page !== 'admin-dashboard-new.html') return;

  const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
  if (!currentAdmin) {
    alert('Please login first!');
    window.location.href = 'admin-login-new.html';
    return;
  }

  console.log('Admin already checked and logged in from auth-new.js');
  // Dashboard will handle display, just ensure data is loaded after a moment
  setTimeout(() => {
    if (typeof loadAllReports === 'function') {
      loadAllReports();
    }
  }, 500);
})();
