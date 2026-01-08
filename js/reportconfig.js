// Import API keys from separate file
import { FIREBASE_CONFIG_REPORTS, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, GOOGLE_MAPS_API_KEY } from './api-keys.js';

// Make global for compatibility
window.FIREBASE_CONFIG_REPORTS = FIREBASE_CONFIG_REPORTS;

// Firebase Configuration
// Project: civic-portal-aca20
export const FIREBASE_CONFIG = FIREBASE_CONFIG_REPORTS;

// Cloudinary Configuration
// Sign up at https://cloudinary.com for free account
export const CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
export const UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;

// Google Maps API Key
// Get your API key from https://console.cloud.google.com/
// Make sure to restrict it to your domain for security
export { GOOGLE_MAPS_API_KEY };

// Make global for compatibility
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.GOOGLE_MAPS_API_KEY = GOOGLE_MAPS_API_KEY;
window.CLOUDINARY_CLOUD_NAME = CLOUDINARY_CLOUD_NAME;
window.CLOUDINARY_UPLOAD_PRESET = CLOUDINARY_UPLOAD_PRESET;