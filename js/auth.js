// Authentication Logic

// Helper variables
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// =======================
// REGISTRATION LOGIC
// =======================
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const fullName = document.getElementById('fullName').value;
        const mobile = document.getElementById('mobile').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Basic Validation
        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        if (mobile.length !== 10) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        try {
            // Check if user already exists
            const userDocRef = db.collection('users').doc(mobile);
            const doc = await userDocRef.get();

            if (doc.exists) {
                alert("This mobile number is already registered. Please Login.");
                return;
            }

            // Create new user document
            // Using Mobile Number as the Document ID for easy lookup
            await userDocRef.set({
                fullName: fullName,
                mobile: mobile,
                password: password, // Note: In production, NEVER store plain text passwords. Use Firebase Auth or hash it.
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Registration Successful! Redirecting to Login...");
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Error registering user: ", error);
            alert("Registration failed. Please try again. check console for details.");
        }
    });
}

// =======================
// LOGIN LOGIC
// =======================
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const mobile = document.getElementById('mobile').value;
        const password = document.getElementById('password').value;

        try {
            // Get user document
            const userDocRef = db.collection('users').doc(mobile);
            const doc = await userDocRef.get();

            if (!doc.exists) {
                alert("No account found with this mobile number. Please Register first.");
                return;
            }

            const userData = doc.data();

            // Verify Password
            if (userData.password === password) {
                // Store current user in localStorage for session management
                localStorage.setItem('currentUser', mobile);
                localStorage.setItem('currentUserName', userData.fullName);
                
                alert(`Welcome back, ${userData.fullName}! Login Successful.`);
                // Redirect to report page after successful login
                window.location.href = 'report.html'; 
            } else {
                alert("Incorrect Password. Please try again.");
            }

        } catch (error) {
            console.error("Error logging in: ", error);
            alert("Login failed. Please try again.");
        }
    });
}

// =======================
// FORGOT PASSWORD LOGIC
// =======================
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const resetPasswordModal = document.getElementById('resetPasswordModal');
const closeResetModal = document.getElementById('closeResetModal');
const verifyMobileForm = document.getElementById('verifyMobileForm');
const newPasswordForm = document.getElementById('newPasswordForm');

if (forgotPasswordLink) {
    // Open Modal
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        resetPasswordModal.classList.add('active');
        // Reset forms
        verifyMobileForm.reset();
        newPasswordForm.reset();
        verifyMobileForm.style.display = 'block';
        newPasswordForm.style.display = 'none';
    });

    // Close Modal
    closeResetModal.addEventListener('click', () => {
        resetPasswordModal.classList.remove('active');
    });

    // Close on outside click
    resetPasswordModal.addEventListener('click', (e) => {
        if (e.target === resetPasswordModal) {
            resetPasswordModal.classList.remove('active');
        }
    });

    // Step 1: Verify Mobile
    verifyMobileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mobile = document.getElementById('resetMobile').value;

        try {
            const userDoc = await db.collection('users').doc(mobile).get();

            if (userDoc.exists) {
                // User found
                document.getElementById('verifiedMobile').value = mobile;
                verifyMobileForm.style.display = 'none';
                newPasswordForm.style.display = 'block';
            } else {
                alert("Mobile number not found. Please register first.");
            }
        } catch (error) {
            console.error("Error verifying user:", error);
            alert("An error occurred. Please try again.");
        }
    });

    // Step 2: Reset Password
    newPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mobile = document.getElementById('verifiedMobile').value;
        const newPassword = document.getElementById('newPassword').value;

        try {
            await db.collection('users').doc(mobile).update({
                password: newPassword
            });

            alert("Password updated successfully! Please login with your new password.");
            resetPasswordModal.classList.remove('active');

        } catch (error) {
            console.error("Error updating password:", error);
            alert("Failed to update password. Please try again.");
        }
    });
}