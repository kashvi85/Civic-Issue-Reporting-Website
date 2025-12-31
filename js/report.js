// Report Form Logic

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Initialize Firebase with config (with error handling)
let app, db;
try {
    if (typeof FIREBASE_CONFIG !== 'undefined') {
        app = initializeApp(FIREBASE_CONFIG);
        db = getFirestore(app);
    } else {
        console.error('FIREBASE_CONFIG not found. Check reportconfig.js');
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Load Google Maps API dynamically with key from reportconfig.js
function loadGoogleMapsAPI() {
    return new Promise((resolve) => {
        // Only load if not already loaded
        if (mapsAPILoaded) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            mapsAPILoaded = true;
            resolve();
        };
        document.head.appendChild(script);
    });
}

// Load Google Maps API when needed
loadGoogleMapsAPI();

// Global Variables
let capturedImageFile = null;
let selectedCoords = null;
let locationMethod = null;
let map, marker;
let cameraStream = null;
let mapsAPILoaded = false;

// DOM Elements
const takePhotoBtn = document.getElementById('takePhotoBtn');
const galleryBtn = document.getElementById('galleryBtn');
const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const photoPreview = document.getElementById('photoPreview');
const urlMethodBtn = document.getElementById('urlMethodBtn');
const pinMethodBtn = document.getElementById('pinMethodBtn');
const urlContent = document.getElementById('urlContent');
const pinContent = document.getElementById('pinContent');
const mapsUrlInput = document.getElementById('mapsUrl');
const urlStatus = document.getElementById('urlStatus');
const mapStatus = document.getElementById('mapStatus');
const reportForm = document.getElementById('reportForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const successModal = document.getElementById('successModal');
const reportIdDisplay = document.getElementById('reportIdDisplay');
const copyIdBtn = document.getElementById('copyIdBtn');
const logoutBtn = document.getElementById('logoutBtn');
const cameraModal = document.getElementById('cameraModal');
const cameraFeed = document.getElementById('cameraFeed');
const photoCanvas = document.getElementById('photoCanvas');
const capturePhotoBtn = document.getElementById('capturePhotoBtn');
const cancelCameraBtn = document.getElementById('cancelCameraBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');

// Check if user is logged in
function checkUserLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
    }
}

// Set Current DateTime
function setCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('captureTime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Photo Upload Handlers
takePhotoBtn.addEventListener('click', async () => {
    try {
        // Request camera permission and open camera modal
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });

        // Save the stream globally
        cameraStream = stream;

        // Open camera modal
        cameraModal.classList.add('active');

        // Play the video stream
        cameraFeed.srcObject = stream;
        cameraFeed.play();
    } catch (error) {
        if (error.name === 'NotAllowedError') {
            alert('❌ Camera permission denied. Please allow camera access and try again.');
        } else if (error.name === 'NotFoundError') {
            alert('❌ No camera device found on this device.');
        } else if (error.name === 'NotSupportedError') {
            alert('❌ Camera is not supported in this browser.');
        } else {
            console.error('Camera error:', error);
            alert('❌ Error accessing camera: ' + error.message);
        }
    }
});

// Close camera functions
function closeCameraModal() {
    cameraModal.classList.remove('active');
    
    // Stop camera stream
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    cameraFeed.srcObject = null;
}

closeCameraBtn.addEventListener('click', closeCameraModal);
cancelCameraBtn.addEventListener('click', closeCameraModal);

// Capture photo from camera
capturePhotoBtn.addEventListener('click', async () => {
    try {
        // Set canvas size to match video
        photoCanvas.width = cameraFeed.videoWidth;
        photoCanvas.height = cameraFeed.videoHeight;

        // Draw current video frame to canvas
        const context = photoCanvas.getContext('2d');
        context.drawImage(cameraFeed, 0, 0);

        // Convert canvas to blob and create file
        photoCanvas.toBlob(blob => {
            // Create a File object from the blob
            const timestamp = Date.now();
            capturedImageFile = new File([blob], `photo_${timestamp}.jpg`, { type: 'image/jpeg' });

            // Update preview
            photoPreview.innerHTML = `<i class="fa-solid fa-check"></i> Photo captured: photo_${timestamp}.jpg`;
            photoPreview.classList.add('success');
            photoPreview.classList.remove('error');

            // Close camera modal
            closeCameraModal();
        }, 'image/jpeg', 0.95);
    } catch (error) {
        console.error('Error capturing photo:', error);
        alert('❌ Error capturing photo. Please try again.');
    }
});

galleryBtn.addEventListener('click', () => {
    galleryInput.click();
});

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        capturedImageFile = file;
        photoPreview.innerHTML = `<i class="fa-solid fa-check"></i> Photo selected: ${file.name}`;
        photoPreview.classList.add('success');
        photoPreview.classList.remove('error');
    }
}

cameraInput.addEventListener('change', handlePhotoUpload);
galleryInput.addEventListener('change', handlePhotoUpload);

// Location Method Selection
urlMethodBtn.addEventListener('click', (e) => {
    e.preventDefault();
    locationMethod = 'url';
    urlContent.classList.add('active');
    pinContent.classList.remove('active');
    urlMethodBtn.classList.add('active');
    pinMethodBtn.classList.remove('active');
    selectedCoords = null;
});

pinMethodBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    locationMethod = 'pin';
    pinContent.classList.add('active');
    urlContent.classList.remove('active');
    pinMethodBtn.classList.add('active');
    urlMethodBtn.classList.remove('active');
    selectedCoords = null;

    // Ensure Google Maps API is loaded
    await loadGoogleMapsAPI();

    // Initialize map with default center if not already
    if (!map) {
        initMap();
    }

    // Request location with continuous refinement for better accuracy
    if (navigator.geolocation) {
        mapStatus.style.display = 'flex';
        mapStatus.innerHTML = '<i class="fa-solid fa-location-dot"></i> 📡 Requesting location permission...';
        
        // Show helpful alert
        alert('🛰️ GPS is searching for satellites.\nPlease wait, do not navigate away!');
        
        let bestAccuracy = Infinity;
        let bestPosition = null;
        let watchId = null;
        let lockTimeout = null;
        
        // Function to update map with best position
        const updateBestPosition = () => {
            if (bestPosition) {
                const lat = bestPosition.coords.latitude;
                const lng = bestPosition.coords.longitude;
                const accuracy = bestPosition.coords.accuracy;
                selectedCoords = { lat, lng };
                if (marker) marker.setPosition(selectedCoords);
                if (map) map.setCenter(selectedCoords);
                mapStatus.innerHTML = `<i class="fa-solid fa-location-dot"></i> Location: ${lat.toFixed(6)}, ${lng.toFixed(6)} (±${Math.round(accuracy)}m)`;
            }
        };
        
        // Start watching position for continuous refinement (30 seconds)
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const accuracy = position.coords.accuracy;
                
                // Keep the position with best (lowest) accuracy
                if (accuracy < bestAccuracy) {
                    bestAccuracy = accuracy;
                    bestPosition = position;
                    updateBestPosition();
                }
                
                // Auto-lock if accuracy is excellent (±10m or better)
                if (accuracy <= 10) {
                    navigator.geolocation.clearWatch(watchId);
                    if (lockTimeout) clearTimeout(lockTimeout);
                    mapStatus.innerHTML = `<i class="fa-solid fa-check"></i> ✅ Locked ±${Math.round(accuracy)}m`;
                }
            },
            (err) => {
                console.warn('Geolocation error:', err);
            },
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
        );
        
        // Auto-lock after 30 seconds of watching
        lockTimeout = setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            if (bestPosition) {
                mapStatus.innerHTML = `<i class="fa-solid fa-check"></i> ✅ Best found ±${Math.round(bestAccuracy)}m`;
            } else {
                mapStatus.innerHTML = '<i class="fa-solid fa-map-pin"></i> Drag marker to set location.';
            }
        }, 30000);
    } else {
        mapStatus.innerHTML = '<i class="fa-solid fa-map-pin"></i> Geolocation not supported.';
        mapStatus.style.display = 'flex';
    }
});

// URL Coordinate Extraction
mapsUrlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    
    if (!url) {
        urlStatus.style.display = 'none';
        selectedCoords = null;
        return;
    }

    const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /place\/[^\/]+\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
        /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
        /ll=(-?\d+\.\d+),(-?\d+\.\d+)/
    ];
    
    let match = null;
    for (const pattern of patterns) {
        match = url.match(pattern);
        if (match) break;
    }
    
    if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        selectedCoords = { lat, lng };
        urlStatus.style.display = 'flex';
        urlStatus.innerHTML = `<i class="fa-solid fa-check"></i> Location extracted: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        urlStatus.classList.remove('error');
        urlStatus.classList.add('success');
    } else {
        urlStatus.style.display = 'flex';
        urlStatus.innerHTML = '<i class="fa-solid fa-exclamation"></i> Could not extract coordinates. Please check the URL format.';
        urlStatus.classList.remove('success');
        urlStatus.classList.add('error');
        selectedCoords = null;
    }
});

// Update Map Status
function updateMapStatus() {
    if (selectedCoords) {
        mapStatus.innerHTML = `<i class="fa-solid fa-location-dot"></i> Location set: ${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`;
        mapStatus.style.display = 'flex';
    }
}

// Initialize Map with Location Permission and accuracy refinement
async function initMap() {
    let initialCenter = { lat: 26.8467, lng: 80.9462 }; // Kanpur default
    
    // Request location permission and get initial position
    if (navigator.geolocation) {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                });
            });
            
            initialCenter = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            mapStatus.innerHTML = '<i class="fa-solid fa-location-dot"></i> Initial location detected! Refining accuracy…';
            mapStatus.style.display = 'flex';
            
            // Watch for better accuracy
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    
                    initialCenter = { lat, lng };
                    
                    // Update marker position
                    if (marker) {
                        marker.setPosition(initialCenter);
                    }
                    
                    // Center map
                    if (map) {
                        map.setCenter(initialCenter);
                    }
                    
                    selectedCoords = initialCenter;
                    
                    // Check if accuracy is good enough to lock
                    if (accuracy <= 15) {
                        navigator.geolocation.clearWatch(watchId);
                        mapStatus.innerHTML = `<i class="fa-solid fa-location-dot"></i> Location locked ±${Math.round(accuracy)}m`;
                        mapStatus.style.display = 'flex';
                    } else {
                        mapStatus.innerHTML = `<i class="fa-solid fa-location-dot"></i> Refining… ±${Math.round(accuracy)}m accuracy`;
                        mapStatus.style.display = 'flex';
                    }
                },
                (error) => {
                    console.log('Watch error:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 0
                }
            );
        } catch (error) {
            console.log('Location permission denied or unavailable:', error);
            mapStatus.innerHTML = '<i class="fa-solid fa-map-pin"></i> Using default location. Drag marker to set your location.';
            mapStatus.style.display = 'flex';
        }
    }
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: initialCenter,
        mapTypeControl: true
    });

    marker = new google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP
    });

    selectedCoords = initialCenter;
    updateMapStatus();

    marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        selectedCoords = {
            lat: pos.lat(),
            lng: pos.lng()
        };
        updateMapStatus();
    });
    
    // Map click to move marker
    map.addListener('click', (e) => {
        const latLng = e.latLng;
        marker.setPosition(latLng);
        selectedCoords = {
            lat: latLng.lat(),
            lng: latLng.lng()
        };
        updateMapStatus();
    });
}

// Upload to Cloudinary
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error('Failed to upload image to Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
}

// Form Submission
reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validation
    if (!capturedImageFile) {
        alert('⚠️ Please upload a photo of the issue!');
        return;
    }

    if (!selectedCoords) {
        alert('⚠️ Please select a location using either URL or Map pin option!');
        return;
    }

    const issueType = document.getElementById('issueType').value;
    if (!issueType) {
        alert('⚠️ Please select an issue type!');
        return;
    }

    const description = document.getElementById('description').value;
    if (!description.trim()) {
        alert('⚠️ Please provide a description!');
        return;
    }

    // Show loading
    loadingOverlay.classList.add('active');

    try {
        // Upload image to Cloudinary
        const imageUrl = await uploadToCloudinary(capturedImageFile);

        // Get current user (should be user ID or email string)
        let currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            currentUser = 'anonymous';
        }

        // Prepare data for Firestore
        const reportData = {
            issueType: issueType,
            description: description,
            captureTime: document.getElementById('captureTime').value,
            coordinates: selectedCoords,
            locationMethod: locationMethod,
            imageUrl: imageUrl,
            status: 'Reported',
            userId: currentUser,
            timestamp: new Date().toISOString()
        };

        // Add to Firestore (only if Firebase is initialized)
        let docRef;
        if (db) {
            docRef = await addDoc(collection(db, 'reports'), reportData);
        } else {
            console.warn('Firebase not initialized. Data saved locally only.');
            docRef = { id: 'LOCAL_' + Date.now() };
        }

        // Hide loading
        loadingOverlay.classList.remove('active');

        // Show success modal with report ID
        reportIdDisplay.textContent = docRef.id;
        successModal.classList.add('active');

    } catch (error) {
        console.error('Error submitting report:', error);
        loadingOverlay.classList.remove('active');
        alert('❌ Error submitting report. Please try again.\n\n' + error.message);
    }
});

// Copy Report ID
copyIdBtn.addEventListener('click', () => {
    const reportId = reportIdDisplay.textContent;
    navigator.clipboard.writeText(reportId).then(() => {
        const originalText = copyIdBtn.innerHTML;
        copyIdBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            copyIdBtn.innerHTML = originalText;
        }, 2000);
    });
});

// Close success modal
closeSuccessBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkUserLogin();
    setCurrentDateTime();
});

// Make initMap globally accessible for Google Maps
window.initMap = initMap;
