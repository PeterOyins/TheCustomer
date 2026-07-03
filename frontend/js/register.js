const API_BASE = "/api";

// ── Password visibility toggle ──────────────────
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

// ── Loading state helpers ───────────────────────
function setLoading(on) {
    document.getElementById("btnText").classList.toggle("hidden", on);
    document.getElementById("btnLoader").classList.toggle("hidden", !on);
    document.getElementById("submitBtn").disabled = on;
}

// ── Form submit ─────────────────────────────────
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Basic client-side guards
    if (!name || !email || !password) {
        showAlert("Please fill in all fields.", "error");
        return;
    }
    if (password.length < 6) {
        showAlert("Password must be at least 6 characters.", "error");
        return;
    }

    setLoading(true);

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            // express-validator returns { errors: [{msg: "..."}] }
            // our own errors return { message: "..." }
            const msg = data.errors ? data.errors[0].msg : data.message;
            showAlert(msg || "Registration failed. Please try again.", "error");
        } else {
            showAlert("Account created! Taking you to login…", "success");
            setTimeout(() => { window.location.href = "login.html"; }, 1600);
        }
    } catch {
        showAlert("Cannot reach the server. Make sure it is running on port 3000.", "error");
    } finally {
        setLoading(false);
    }
});
