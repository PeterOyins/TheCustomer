// ── State ────────────────────────────────────────
let businessId   = null;
let bizRating    = 0;
let staffRating  = 0;
let selectedStaffId = null;
let staffToggleOn   = false;
let allStaff        = [];

const STAR_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

// ── UI helpers ───────────────────────────────────
function showEl(id)  { document.getElementById(id).classList.remove("hidden"); }
function hideEl(id)  { document.getElementById(id).classList.add("hidden"); }

// ── Build interactive star row ───────────────────
function buildStars(containerId, onChange) {
    const container = document.getElementById(containerId);
    let current = 0;

    container.innerHTML = "";
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "star-btn";
        btn.textContent = "★";
        btn.dataset.v = i;

        btn.addEventListener("click", () => {
            current = i;
            paint(i);
            onChange(i);
        });

        btn.addEventListener("mouseenter", () => paint(i, true));
        container.appendChild(btn);
    }

    container.addEventListener("mouseleave", () => paint(current));

    function paint(hovered, isHover = false) {
        container.querySelectorAll(".star-btn").forEach((s, idx) => {
            s.classList.toggle("selected", idx < current && !isHover);
            s.classList.toggle("hovered", idx < hovered);
        });
    }

    return () => current;
}

// ── Get businessId from URL ──────────────────────
function getBusinessId() {
    // Handles: /feedback.html?businessId=1  OR  /feedback/1 (after redirect)
    const params = new URLSearchParams(window.location.search);
    return params.get("businessId");
}

// ── Render staff chips ───────────────────────────
function renderStaffChips(list) {
    const grid = document.getElementById("staffGrid");
    grid.innerHTML = list.map(s => {
        const init = s.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        return `
        <div class="staff-chip" id="chip-${s.id}" data-id="${s.id}" data-name="${s.name.replace(/"/g, "&quot;")}">
            <div class="chip-avatar">${init}</div>
            <div class="chip-name">${s.name}</div>
            <div class="chip-pos">${s.position}</div>
        </div>`;
    }).join("");

    grid.addEventListener("click", (e) => {
        const chip = e.target.closest(".staff-chip");
        if (!chip) return;
        selectStaff(Number(chip.dataset.id), chip.dataset.name);
    });
}

// ── Select a staff member ────────────────────────
function selectStaff(id, name) {
    selectedStaffId = id;

    document.querySelectorAll(".staff-chip").forEach(c => c.classList.remove("selected"));
    document.getElementById(`chip-${id}`).classList.add("selected");

    document.getElementById("selectedStaffName").textContent = name.split(" ")[0];
    showEl("staffRatingSection");
}

// ── Staff toggle ─────────────────────────────────
document.getElementById("staffToggle").addEventListener("click", () => {
    staffToggleOn = !staffToggleOn;
    const track = document.getElementById("toggleTrack");
    track.classList.toggle("on", staffToggleOn);

    if (staffToggleOn) {
        showEl("staffPickerSection");
    } else {
        hideEl("staffPickerSection");
        hideEl("staffRatingSection");
        selectedStaffId = null;
        staffRating = 0;
        // Reset staff chips
        document.querySelectorAll(".staff-chip").forEach(c => c.classList.remove("selected"));
    }
});

// ── Load page ────────────────────────────────────
async function init() {
    businessId = getBusinessId();

    if (!businessId) {
        hideEl("pageLoading");
        showEl("pageError");
        return;
    }

    try {
        const res = await fetch(`/api/public/${businessId}/staff`);

        if (!res.ok) {
            hideEl("pageLoading");
            showEl("pageError");
            return;
        }

        const data = await res.json();
        allStaff = data.staff || [];

        // Populate header
        document.getElementById("bizName").textContent = data.business.business_name.toUpperCase();
        document.getElementById("bizType").textContent = data.business.business_type || "";

        // Build star ratings
        buildStars("bizStars", (v) => {
            bizRating = v;
            document.getElementById("bizStarHint").textContent = STAR_LABELS[v];
        });

        buildStars("staffStars", (v) => {
            staffRating = v;
            document.getElementById("staffStarHint").textContent = STAR_LABELS[v];
        });

        // Render staff chips (even if not immediately visible)
        if (allStaff.length > 0) {
            renderStaffChips(allStaff);
        } else {
            document.getElementById("staffPickerSection").innerHTML =
                `<p style="font-size:0.85rem;color:var(--slate)">No staff members listed for this business.</p>`;
        }

        hideEl("pageLoading");
        showEl("feedbackForm");

    } catch {
        hideEl("pageLoading");
        showEl("pageError");
    }
}

// ── Submit ────────────────────────────────────────
document.getElementById("submitBtn").addEventListener("click", async () => {
    if (!bizRating) {
        const hint = document.getElementById("bizStarHint");
        hint.textContent = "Please give a rating before submitting!";
        hint.style.color = "#b91c1c";
        document.getElementById("bizStars").scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    document.getElementById("submitText").classList.add("hidden");
    document.getElementById("submitLoader").classList.remove("hidden");
    document.getElementById("submitBtn").disabled = true;

    const body = {
        business_rating:  bizRating,
        business_comment: document.getElementById("bizComment").value.trim() || null,
    };

    if (staffToggleOn && selectedStaffId) {
        body.staff_id      = selectedStaffId;
        body.staff_rating  = staffRating || null;
        body.staff_comment = document.getElementById("staffComment").value.trim() || null;
    }

    try {
        const res = await fetch(`/api/public/${businessId}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.message || "Submission failed. Please try again.");
            document.getElementById("submitText").classList.remove("hidden");
            document.getElementById("submitLoader").classList.add("hidden");
            document.getElementById("submitBtn").disabled = false;
            return;
        }

        // Show thank you screen
        hideEl("feedbackForm");
        showEl("thankYou");

    } catch {
        alert("Could not reach the server. Please try again.");
        document.getElementById("submitText").classList.remove("hidden");
        document.getElementById("submitLoader").classList.add("hidden");
        document.getElementById("submitBtn").disabled = false;
    }
});

// ── Boot ──────────────────────────────────────────
init();
