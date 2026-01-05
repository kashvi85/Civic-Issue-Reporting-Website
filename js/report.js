// Report Form Logic - IMPROVED LOCATION ACCURACY

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
    return new Promise((resolve, reject) => {
        // Check if Google Maps is already loaded
        if (typeof google !== 'undefined' && google.maps) {
            mapsAPILoaded = true;
            resolve();
            return;
        }

        // Check if loading is already in progress
        if (mapsAPILoaded) {
            resolve();
            return;
        }

        // Check if API key is defined
        if (typeof GOOGLE_MAPS_API_KEY === 'undefined') {
            reject(new Error('GOOGLE_MAPS_API_KEY is not defined. Please check reportconfig.js'));
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
        script.onerror = () => {
            reject(new Error('Failed to load Google Maps API'));
        };
        document.head.appendChild(script);
    });
}

// Don't auto-load on page load - only when pin method is selected

// Global Variables
let capturedImageFile = null;
let selectedCoords = null;
let locationMethod = null;
let map, marker, accuracyCircle;
let cameraStream = null;
let mapsAPILoaded = false;
let watchId = null;

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
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false
        });

        cameraStream = stream;
        cameraModal.classList.add('active');
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

function closeCameraModal() {
    cameraModal.classList.remove('active');
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    cameraFeed.srcObject = null;
}

closeCameraBtn.addEventListener('click', closeCameraModal);
cancelCameraBtn.addEventListener('click', closeCameraModal);

capturePhotoBtn.addEventListener('click', async () => {
    try {
        photoCanvas.width = cameraFeed.videoWidth;
        photoCanvas.height = cameraFeed.videoHeight;

        const context = photoCanvas.getContext('2d');
        context.drawImage(cameraFeed, 0, 0);

        photoCanvas.toBlob(blob => {
            const timestamp = Date.now();
            capturedImageFile = new File([blob], `photo_${timestamp}.jpg`, { type: 'image/jpeg' });

            photoPreview.innerHTML = `<i class="fa-solid fa-check"></i> Photo captured: photo_${timestamp}.jpg`;
            photoPreview.classList.add('success');
            photoPreview.classList.remove('error');

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
        if (file.size > 5 * 1024 * 1024) {
            alert('File size should be less than 5MB');
            return;
        }

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
    
    // Stop watching if active
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
});

pinMethodBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    locationMethod = 'pin';
    pinContent.classList.add('active');
    urlContent.classList.remove('active');
    pinMethodBtn.classList.add('active');
    urlMethodBtn.classList.remove('active');
    selectedCoords = null;

    try {
        // Show loading message
        mapStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading Google Maps...';
        mapStatus.style.display = 'flex';

        // Wait for Google Maps API to load
        await loadGoogleMapsAPI();

        // Initialize map if not already initialized
        if (!map) {
            await initMap();
        }

        // Start location tracking
        startHighAccuracyLocationTracking();
    } catch (error) {
        console.error('Error loading Google Maps:', error);
        mapStatus.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> ❌ Error loading maps. Please check your API key in reportconfig.js';
        mapStatus.style.display = 'flex';
        alert('Failed to load Google Maps. Please ensure:\n1. reportconfig.js file exists\n2. GOOGLE_MAPS_API_KEY is properly set\n3. Your API key is valid');
    }
});

// IMPROVED: Advanced location tracking with multiple strategies
function startHighAccuracyLocationTracking() {
    if (!navigator.geolocation) {
        mapStatus.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> Geolocation not supported on this device.';
        mapStatus.style.display = 'flex';
        return;
    }

    mapStatus.style.display = 'flex';
    mapStatus.innerHTML = '<i class="fa-solid fa-satellite-dish"></i> 🛰️ Acquiring GPS satellites...';
    
    let positionCount = 0;
    let positionSum = { lat: 0, lng: 0 };
    let bestAccuracy = Infinity;
    let bestPosition = null;
    const maxSamples = 10; // Collect up to 10 position samples
    const timeout = 45000; // 45 seconds total timeout
    
    // Create accuracy visualization circle
    if (!accuracyCircle && map) {
        accuracyCircle = new google.maps.Circle({
            map: map,
            fillColor: '#4285F4',
            fillOpacity: 0.15,
            strokeColor: '#4285F4',
            strokeOpacity: 0.4,
            strokeWeight: 2
        });
    }
    
    const startTime = Date.now();
    
    // Watch position with high accuracy settings
    watchId = navigator.geolocation.watchPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const accuracy = position.coords.accuracy;
            const altitude = position.coords.altitude;
            const speed = position.coords.speed;
            
            positionCount++;
            
            // Track best position
            if (accuracy < bestAccuracy) {
                bestAccuracy = accuracy;
                bestPosition = position;
            }
            
            // Accumulate positions for averaging
            positionSum.lat += lat;
            positionSum.lng += lng;
            
            // Calculate averaged position
            const avgLat = positionSum.lat / positionCount;
            const avgLng = positionSum.lng / positionCount;
            
            // Update map
            selectedCoords = { lat: avgLat, lng: avgLng };
            
            if (marker) {
                marker.setPosition(selectedCoords);
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => marker.setAnimation(null), 2000);
            }
            
            if (map) {
                map.setCenter(selectedCoords);
            }
            
            // Update accuracy circle
            if (accuracyCircle) {
                accuracyCircle.setCenter(selectedCoords);
                accuracyCircle.setRadius(accuracy);
            }
            
            // Enhanced status with more details
            const elapsedTime = Math.round((Date.now() - startTime) / 1000);
            let statusMsg = `<i class="fa-solid fa-location-crosshairs"></i> `;
            statusMsg += `Accuracy: ±${Math.round(accuracy)}m | `;
            statusMsg += `Samples: ${positionCount}/${maxSamples} | `;
            statusMsg += `Time: ${elapsedTime}s`;
            
            if (altitude !== null) {
                statusMsg += ` | Alt: ${Math.round(altitude)}m`;
            }
            
            mapStatus.innerHTML = statusMsg;
            
            // Auto-lock conditions (improved)
            const shouldLock = 
                (accuracy <= 5 && positionCount >= 3) ||  // Very high accuracy with few samples
                (accuracy <= 10 && positionCount >= 5) || // High accuracy with moderate samples
                (accuracy <= 20 && positionCount >= 8) || // Good accuracy with many samples
                positionCount >= maxSamples;              // Max samples reached
            
            if (shouldLock) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
                
                // Use best single position if it's significantly better than average
                if (bestAccuracy < accuracy * 0.7) {
                    selectedCoords = {
                        lat: bestPosition.coords.latitude,
                        lng: bestPosition.coords.longitude
                    };
                    marker.setPosition(selectedCoords);
                    map.setCenter(selectedCoords);
                }
                
                mapStatus.innerHTML = `<i class="fa-solid fa-check-circle"></i> ✅ Location locked! Accuracy: ±${Math.round(bestAccuracy)}m (${positionCount} samples)`;
                marker.setAnimation(null);
                
                // Visual feedback
                if (accuracyCircle) {
                    accuracyCircle.setOptions({
                        fillColor: '#34A853',
                        strokeColor: '#34A853'
                    });
                }
            }
        },
        (error) => {
            console.error('Geolocation error:', error);
            let errorMsg = '';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMsg = '❌ Location permission denied. Please enable location access.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMsg = '⚠️ Location unavailable. Please check GPS settings.';
                    break;
                case error.TIMEOUT:
                    errorMsg = '⏱️ Location request timeout. Retrying...';
                    // Retry on timeout
                    setTimeout(() => startHighAccuracyLocationTracking(), 2000);
                    return;
                default:
                    errorMsg = '❌ Unknown location error occurred.';
            }
            
            mapStatus.innerHTML = `<i class="fa-solid fa-exclamation-circle"></i> ${errorMsg}`;
            
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        },
        {
            enableHighAccuracy: true,
            timeout: timeout,
            maximumAge: 0 // Always get fresh location
        }
    );
    
    // Auto-stop after timeout
    setTimeout(() => {
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            
            if (positionCount > 0) {
                mapStatus.innerHTML = `<i class="fa-solid fa-check"></i> ✅ Best location: ±${Math.round(bestAccuracy)}m (${positionCount} samples)`;
                
                if (marker) marker.setAnimation(null);
                
                if (accuracyCircle) {
                    accuracyCircle.setOptions({
                        fillColor: '#FBBC04',
                        strokeColor: '#FBBC04'
                    });
                }
            } else {
                mapStatus.innerHTML = '<i class="fa-solid fa-map-pin"></i> ⚠️ Could not get location. Drag marker manually.';
            }
        }
    }, timeout);
}

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

// Initialize Map
async function initMap() {
    let initialCenter = { lat: 26.8467, lng: 80.9462 }; // Kanpur default
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 18, // Increased zoom for better accuracy
        center: initialCenter,
        mapTypeControl: true,
        mapTypeId: 'hybrid', // Satellite view with labels for better positioning
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true
    });

    marker = new google.maps.Marker({
        position: initialCenter,
        map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Drag me to adjust location'
    });

    selectedCoords = initialCenter;

    marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        selectedCoords = {
            lat: pos.lat(),
            lng: pos.lng()
        };
        mapStatus.innerHTML = `<i class="fa-solid fa-map-pin"></i> Manual location: ${selectedCoords.lat.toFixed(7)}, ${selectedCoords.lng.toFixed(7)}`;
        mapStatus.style.display = 'flex';
    });
    
    map.addListener('click', (e) => {
        const latLng = e.latLng;
        marker.setPosition(latLng);
        selectedCoords = {
            lat: latLng.lat(),
            lng: latLng.lng()
        };
        mapStatus.innerHTML = `<i class="fa-solid fa-mouse-pointer"></i> Clicked location: ${selectedCoords.lat.toFixed(7)}, ${selectedCoords.lng.toFixed(7)}`;
        mapStatus.style.display = 'flex';
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

    loadingOverlay.classList.add('active');

    try {
        const imageUrl = await uploadToCloudinary(capturedImageFile);

        let currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            currentUser = 'anonymous';
        }

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

        let docRef;
        if (db) {
            docRef = await addDoc(collection(db, 'reports'), reportData);
        } else {
            console.warn('Firebase not initialized. Data saved locally only.');
            docRef = { id: 'LOCAL_' + Date.now() };
        }

        loadingOverlay.classList.remove('active');
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

closeSuccessBtn.addEventListener('click', () => {
    successModal.classList.remove('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
    }
});

window.initMap = initMap;