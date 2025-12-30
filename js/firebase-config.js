// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQ15M6U83OG909NdFO5bTRWMK8__FbJCw",
  authDomain: "civic-issue-website.firebaseapp.com",
  projectId: "civic-issue-website",
  storageBucket: "civic-issue-website.firebasestorage.app",
  messagingSenderId: "53135580066",
  appId: "1:53135580066:web:aa4b0a98e224af68d270fb",
  measurementId: "G-JSPV5EYLYK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore and make it available globally for other scripts
const db = firebase.firestore();
