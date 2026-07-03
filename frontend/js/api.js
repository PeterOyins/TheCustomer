// Shared API utility — loaded before every page's own script

const API_BASE = "/api";

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${path}`, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
        return null;
    }

    return response;
}

function requireAuth() {
    if (!localStorage.getItem("token")) {
        window.location.href = "/login.html";
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector(".nav-logout");
    if (btn) btn.addEventListener("click", logout);
});

function starsDisplay(rating, max = 5) {
    const filled = Math.round(rating || 0);
    return "★".repeat(filled) + "☆".repeat(max - filled);
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (days  > 0)  return `${days}d ago`;
    if (hours > 0)  return `${hours}h ago`;
    if (mins  > 0)  return `${mins}m ago`;
    return "just now";
}
