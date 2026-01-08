// Firebase is already initialized in admin-auth-new.js
// Initialize the reports database on this page
// Don't redeclare db - it's already declared in admin-auth-new.js

// Create a global for reports db (different from auth db)
window.reportsDb = null;

setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
        // Initialize a second app for reports database if not already done
        const reportConfig = {
            apiKey: "AIzaSyDXEUuqoPy3WUGq9q9dNDHY5W1rJNBkKJc",
            authDomain: "civic-portal-aca20.firebaseapp.com",
            projectId: "civic-portal-aca20",
            storageBucket: "civic-portal-aca20.firebasestorage.app",
            messagingSenderId: "1098210123438",
            appId: "1:1098210123438:web:1247b139cd90fafc23973f"
        };

        try {
            const reportApp = firebase.initializeApp(reportConfig, 'reports');
            window.reportsDb = reportApp.firestore();
            console.log('Firebase initialized for reports database');
        } catch (e) {
            if (e.code === 'app/duplicate-app') {
                window.reportsDb = firebase.app('reports').firestore();
                console.log('Using existing reports Firebase app');
            } else {
                console.error('Error initializing reports db:', e);
            }
        }
    } else {
        console.error('Firebase SDK not ready');
    }
}, 100);

// Check if admin is logged in
const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');

if (!currentAdmin) {
    console.log('No admin found in localStorage, redirecting to login...');
    alert('Please login first!');
    window.location.href = 'admin-login-new.html';
} else {
    console.log('Admin logged in:', currentAdmin);
    // Display welcome message with admin name
    const welcomeText = document.getElementById('welcomeText');
    if (welcomeText) {
        welcomeText.textContent = `👨‍💼 ${currentAdmin.name}`;
    } else {
        console.error('welcomeText element not found');
    }

    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = `Welcome, ${currentAdmin.name}! 👋`;
    } else {
        console.error('welcomeMessage element not found');
    }

    const welcomeSection = document.querySelector('.welcome-section p');
    if (welcomeSection) {
        welcomeSection.textContent = `Logged in as: ${currentAdmin.email}`;
    } else {
        console.error('welcome-section p element not found');
    }

    // Load all reports from FIREBASE after a delay to ensure db is initialized
    setTimeout(() => {
        console.log('Calling loadAllReports...');
        loadAllReports();
    }, 300);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Sign out from Firebase if using Google Auth
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().catch(err => console.log('Firebase signOut:', err));
        }

        localStorage.removeItem('currentAdmin');
        localStorage.removeItem('adminAuthToken');
        alert('Logged out successfully!');
        window.location.href = 'admin-login-new.html';
    }
}

// Load all reports FROM FIREBASE
async function loadAllReports() {
    try {
        console.log('Starting to load reports...');
        console.log('Reports DB object:', window.reportsDb);

        // Wait for db to be initialized
        if (!window.reportsDb) {
            console.warn('Reports DB not initialized, waiting...');
            setTimeout(loadAllReports, 200);
            return;
        }

        // Get all reports from Firebase
        let snapshot;
        try {
            snapshot = await window.reportsDb.collection('reports')
                .orderBy('timestamp', 'desc')
                .get();
        } catch (orderError) {
            console.warn('orderBy failed, trying without ordering:', orderError);
            snapshot = await window.reportsDb.collection('reports').get();
        }

        console.log('Snapshot received, docs count:', snapshot.size);

        const allReports = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('Doc data:', data);
            const report = {
                id: doc.id,
                ...data
            };
            // Set status to 'pending' if it doesn't exist or is empty
            if (!report.status) {
                report.status = 'pending';
            }
            allReports.push(report);
        });

        console.log('All reports:', allReports);

        // Log each report's status for debugging
        allReports.forEach((r, i) => {
            console.log(`Report ${i}: status = "${r.status}" (type: ${typeof r.status})`);
        });

        // Get unique statuses
        const uniqueStatuses = [...new Set(allReports.map(r => r.status))];
        console.log('Unique statuses found:', uniqueStatuses);

        console.log('Status breakdown:', {
            total: allReports.length,
            pending: allReports.filter(i => i.status === 'pending').length,
            inProgress: allReports.filter(i => i.status === 'in-progress').length,
            resolved: allReports.filter(i => i.status === 'resolved').length
        });

        // Update stats
        const total = allReports.length;
        const pending = allReports.filter(i => i.status === 'pending').length;
        const inProgress = allReports.filter(i => i.status === 'in-progress').length;
        const resolved = allReports.filter(i => i.status === 'resolved').length;

        console.log('Setting stats - total:', total, 'pending:', pending, 'inProgress:', inProgress, 'resolved:', resolved);

        document.querySelectorAll('.stat-number')[0].textContent = total;
        document.querySelectorAll('.stat-number')[1].textContent = pending;
        document.querySelectorAll('.stat-number')[2].textContent = inProgress;
        document.querySelectorAll('.stat-number')[3].textContent = resolved;

        // Display reports
        displayReports(allReports);

    } catch (error) {
        console.error('Error loading reports from Firebase:', error);
        alert('Error loading reports: ' + error.message);
    }
}

// Display reports
function displayReports(reports) {
    console.log('displayReports called with:', reports);
    const container = document.querySelector('.reports-list');

    console.log('Container found:', container);

    if (!container) {
        console.error('Container .reports-list not found in DOM');
        return;
    }

    if (reports.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 40px;">No reports submitted yet.</p>';
        return;
    }

    container.innerHTML = '';

    const categoryIcons = {
        'Pothole': '🚧 Roads & Infrastructure',
        'Garbage Collection': '🗑️ Sanitation & Waste',
        'Street Light': '💡 Public Utilities',
        'Road Damage': '🛣️ Road Damage',
        'Water Supply': '💧 Water Supply',
        'Drainge:': '🌊 Drainage issues',
        'other': '📋 Other'
    };

    reports.forEach((report) => {
        const status = report.status || 'pending';  // Default to 'pending' if undefined
        const statusClass = status === 'pending' ? 'status-pending' :
            status === 'in-progress' ? 'status-progress' :
                'status-resolved';

        const statusText = status === 'pending' ? 'Pending' :
            status === 'in-progress' ? 'In Progress' :
                'Resolved';

        const timeAgo = report.timestamp ? getTimeAgo(report.timestamp.toDate ? report.timestamp.toDate() : new Date(report.timestamp)) : 'Just now';

        // Format location with coordinates
        let locationDisplay = '📍 Location not specified';
        let coordinatesDisplay = '';

        // Check for coordinates - they are nested in coordinates object
        const lat = report.coordinates?.lat;
        const lng = report.coordinates?.lng;

        console.log(`Report ${report.id} coordinates:`, lat, lng);

        if (lat && lng) {
            const latFormatted = parseFloat(lat).toFixed(6);
            const lngFormatted = parseFloat(lng).toFixed(6);

            console.log(`Formatted coords for ${report.id}:`, latFormatted, lngFormatted);

            // Main location display with coordinates
            locationDisplay = `📍 ${latFormatted}°N, ${lngFormatted}°E`;

            // Google Maps link
            coordinatesDisplay = `<a href="https://www.google.com/maps?q=${latFormatted},${lngFormatted}" target="_blank" style="font-size: 11px; color: #2563eb; text-decoration: none; margin-top: 6px; display: inline-block;">📍 View on Google Maps</a>`;
        }

        const card = `
            <div class="report-card admin-card">
                <div class="report-header">
                    <div>
                        <span class="report-category">${categoryIcons[report.category] || report.category}</span>
                        <h3>${report.description.substring(0, 50)}${report.description.length > 50 ? '...' : ''}</h3>
                        <p class="reporter">Reported by: ${report.reportedBy || 'Guest'}</p>
                    </div>
                </div>
                <p class="report-desc">${report.description}</p>
                <div class="report-footer">
                    <span>${locationDisplay}</span>
                    <span>⏰ ${timeAgo}</span>
                </div>
                ${coordinatesDisplay ? `<div style="padding: 8px 0; margin: 4px 0 8px 0;">${coordinatesDisplay}</div>` : ''}
                <div class="admin-actions">
                    <button class="btn-action-small ${status === 'pending' ? 'btn-active' : 'btn-pending'}" onclick="updateStatus('${report.id}', 'pending')">Pending</button>
                    <button class="btn-action-small ${status === 'in-progress' ? 'btn-active' : 'btn-progress'}" onclick="updateStatus('${report.id}', 'in-progress')">In Progress</button>
                    <button class="btn-action-small ${status === 'resolved' ? 'btn-active' : 'btn-resolve'}" onclick="updateStatus('${report.id}', 'resolved')">Resolved</button>
                    <button class="btn-action-small btn-delete" onclick="deleteReport('${report.id}')">Delete</button>
                </div>
            </div>
        `;

        container.innerHTML += card;
    });
}

// Update report status in FIREBASE
async function updateStatus(reportId, newStatus) {
    try {
        // Check if admin is logged in
        const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
        if (!currentAdmin) {
            alert('Only admins can update reports');
            return;
        }

        if (!window.reportsDb) {
            alert('Database connection error. Please refresh the page.');
            return;
        }

        await window.reportsDb.collection('reports').doc(reportId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`✅ Report marked as ${newStatus}!`);
        loadAllReports();

    } catch (error) {
        console.error('Error updating report status:', error);
        alert('Error updating report status: ' + error.message);
    }
}

// Delete report from FIREBASE
async function deleteReport(reportId) {
    if (confirm('Are you sure you want to delete this report?')) {
        try {
            // Check if admin is logged in
            const currentAdmin = JSON.parse(localStorage.getItem('currentAdmin') || 'null');
            if (!currentAdmin) {
                alert('Only admins can delete reports');
                return;
            }

            if (!window.reportsDb) {
                alert('Database connection error. Please refresh the page.');
                return;
            }

            await window.reportsDb.collection('reports').doc(reportId).delete();
            alert('✅ Report deleted!');
            loadAllReports();

        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Error deleting report: ' + error.message);
        }
    }
}

// Helper function
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";

    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";

    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";

    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";

    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";

    return "Just now";
}
