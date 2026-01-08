// Import API keys from separate file
import { FIREBASE_CONFIG_LOGIN } from './api-keys.js';

// Firebase configuration
const firebaseConfig = FIREBASE_CONFIG_LOGIN;

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore and make it available globally for other scripts
const db = firebase.firestore();

// Make them global for non-module scripts
window.firebaseConfig = firebaseConfig;
window.db = db;