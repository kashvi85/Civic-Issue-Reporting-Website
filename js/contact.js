function copyEmail() {
    const email = "civicissueportal@gmail.com";
    navigator.clipboard.writeText(email).then(() => {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.innerHTML;
        const toast = document.getElementById('copyMessage');

        // Change button text temporarily
        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';

        // Show toast
        toast.classList.add('show');

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            toast.classList.remove('show');
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Failed to copy email to clipboard.");
    });
}

// Mail Modal Functions
function openMailModal() {
    const modal = document.getElementById('mailModal');
    modal.classList.add('active');
}

function closeMailModal() {
    const modal = document.getElementById('mailModal');
    modal.classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function (event) {
    const modal = document.getElementById('mailModal');
    if (event.target == modal) {
        modal.classList.remove('active');
    }
}
