// Initialize Leaflet Map
const map = L.map('map').setView([20.5937, 78.9629], 5); // Center on India

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Import API keys
import { FIREBASE_CONFIG_REPORTS } from './api-keys.js';

// Firebase config
const firebaseConfig = FIREBASE_CONFIG_REPORTS;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Function to get marker color by status
function getMarkerColor(status) {
  switch(status?.toLowerCase()) {
    case 'pending': return 'red';
    case 'in progress': return 'orange';
    case 'resolved': return 'green';
    default: return 'blue';
  }
}

// Load markers dynamically
async function loadMarkers() {
  const snapshot = await get(ref(db, 'complaints')); // Path to your complaints
  if (snapshot.exists()) {
    const complaints = snapshot.val();
    Object.values(complaints).forEach(issue => {
      if (issue.latitude && issue.longitude) {
        const color = getMarkerColor(issue.status);
        const marker = L.circleMarker([issue.latitude, issue.longitude], {
          radius: 8,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        marker.bindPopup(`<b>${issue.title || 'Complaint'}</b><br>Status: ${issue.status || 'Pending'}`);
      }
    });
  }
}

// Call the function to load markers
loadMarkers();
