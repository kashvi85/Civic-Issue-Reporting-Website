// Admin Whitelist - Only emails listed here can login
const ADMIN_WHITELIST = [
    "vidhiagarwalmay@gmail.com",
    "gouriagrawal2007@gmail.com",
];

// Function to check if email is whitelisted
function isAdminWhitelisted(email) {
    return ADMIN_WHITELIST.includes(email.toLowerCase());
}

// Function to get all whitelisted admins
function getWhitelistedAdmins() {
    return ADMIN_WHITELIST;
}
