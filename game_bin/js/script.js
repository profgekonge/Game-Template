import { Auth } from './auth.js';

const auth = new Auth();

// Login Event
document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (auth.login(username, password)) {
        alert("Login successful!");
        window.location.href = "game_form.html"; // Redirect to game page
    } else {
        alert("Invalid username or password.");
    }
});

// Register Event
document.getElementById("registerForm").addEventListener("submit", function (event) {
    event.preventDefault();
    const username = document.getElementById("registerUsername").value;
    const password = document.getElementById("registerPassword").value;

    if (auth.register(username, password)) {
        alert("Registration successful! You are now logged in.");
        window.location.href = "game_form.html"; // Redirect after registration
    } else {
        alert("Username already exists.");
    }
});

// Logout Event
document.getElementById("logoutBtn")?.addEventListener("click", function () {
    auth.logout();
    window.location.href = "game_home.html"; // Redirect back to login page
});

// Update UI Based on Authentication

function updateUI() {
    const user = auth.getCurrentUser();
    if (user) {
        document.getElementById("authLinks").classList.add("d-none");
        document.getElementById("userInfo").classList.remove("d-none");
        document.getElementById("usernameDisplay").textContent = `Welcome, ${user}`;
    } else {
        document.getElementById("authLinks").classList.remove("d-none");
        document.getElementById("userInfo").classList.add("d-none");
    }
}

window.onload = updateUI; // Ensure UI updates when page loads
