
// Firebase Configuration
// Project: civic-portal-aca20
const FIREBASE_CONFIG = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_1,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_1
};

// Cloudinary Configuration
// Sign up at https://cloudinary.com for free account
const CLOUDINARY_CLOUD_NAME = 'ddxcx5d7w';
const CLOUDINARY_UPLOAD_PRESET = 'photos';

// Google Maps API Key
// Get your API key from https://console.cloud.google.com/
// Make sure to restrict it to your domain for security
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// ==========================================
// IMPORTANT SECURITY NOTES
// ==========================================
// 1. Never expose these keys in public repositories
// 2. Use .env files or environment variables in production
// 3. Restrict API keys to specific domains in provider dashboards
// 4. Rotate keys periodically
// 5. Monitor usage for suspicious activity
// ==========================================