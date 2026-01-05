// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_2,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_2,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_2,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_2,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_2,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID_2,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID_2
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore and make it available globally for other scripts
const db = firebase.firestore();