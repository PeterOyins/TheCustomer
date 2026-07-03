const API_BASE = "/api";

// ── Password toggle ─────────────────────────────
document.getElementById("togglePw").addEventListener("click", function () {
    const input = document.getElementById("password");
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    this.textContent = isHidden ? "Hide" : "Show";
});

// ── Alert helper ────────────────────────────────
function showAlert(message, type) {
    const el = document.getElementById("alert");
    el.textContent = message;
    el.className = `alert ${type}`;
}

function hideAlert() {
    document.getElementById("alert").className = "alert hidden";
}

// ── Loading state ───────────────────────────────
function setLoading(on) {
    document.getElementById("btnText").classList.toggle("hidden", on);
    document.getElementById("btnLoader").classList.toggle("hidden", !on);
    document.getElementById("submitBtn").disabled = on;
}

// ── Redirect if already logged in ──────────────
if (localStorage.getItem("token")) {
    window.location.href = "dashboard.html";
}

// ── Form submit ─────────────────────────────────
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showAlert("Please enter your email and password.", "error");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.errors ? data.errors[0].msg : data.message;
            showAlert(msg || "Login failed. Please check your credentials.", "error");
        } else {
            // Store the token and redirect
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
        }
    } catch {
        showAlert("Cannot reach the server. Make sure it is running on port 3000.", "error");
    } finally {
        setLoading(false);
    }
});
