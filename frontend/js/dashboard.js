requireAuth();

// ── Helpers ─────────────────────────────────────
function esc(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showAlert(id, msg, type) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.className = `alert ${type}`;
}

function hideEl(id)   { document.getElementById(id).classList.add("hidden"); }
function showEl(id)   { document.getElementById(id).classList.remove("hidden"); }

// ── Rank medal colors ────────────────────────────
const rankClass = ["gold", "silver", "bronze"];

// ── Render leaderboard ───────────────────────────
function renderLeaderboard(list) {
    const el = document.getElementById("leaderboard");

    if (!list || list.length === 0) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏆</div>
                <p>No reviewed staff yet.<br>Share your QR code to get started.</p>
            </div>`;
        return;
    }

    el.innerHTML = list.map((s, i) => {
        const initials = s.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
        const avgRating = s.avg_staff_rating || 0;
        const rc = rankClass[i] || "";
        return `
        <div class="leader-row"
             data-staff-id="${s.id}"
             data-staff-name="${esc(s.name)}"
             data-staff-position="${esc(s.position)}"
             data-staff-avg="${avgRating}"
             data-staff-total="${s.total_reviews}"
             role="button" tabindex="0" aria-label="View ${esc(s.name)}'s reviews">
            <span class="leader-rank ${rc}">${i + 1}</span>
            <div class="leader-avatar">${initials}</div>
            <div class="leader-info">
                <div class="leader-name">${esc(s.name)}</div>
                <div class="leader-position">${esc(s.position)}</div>
            </div>
            <div class="leader-right">
                <div class="leader-rating-num">${avgRating || "—"}</div>
                <div class="leader-stars">${avgRating ? starsDisplay(avgRating) : "no ratings"}</div>
                <div class="leader-count">${s.total_reviews} review${s.total_reviews !== 1 ? "s" : ""}</div>
            </div>
        </div>`;
    }).join("");
}

// ── Render reviews ───────────────────────────────
function renderReviews(list) {
    const el = document.getElementById("recentReviews");

    if (!list || list.length === 0) {
        el.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>No reviews yet. They'll appear here as customers scan your QR code.</p>
            </div>`;
        return;
    }

    el.innerHTML = list.map(r => {
        const staffTag = r.staff_id
            ? `<span class="review-staff-tag">Staff rated ★${r.staff_rating || "?"}</span>`
            : "";
        const comment = r.business_comment
            ? `<div class="review-comment">"${esc(r.business_comment)}"</div>`
            : `<div class="review-comment" style="opacity:0.4;font-style:italic">No comment left</div>`;
        return `
        <div class="review-card">
            <div class="review-stars">${starsDisplay(r.business_rating)}</div>
            <div class="review-date">${timeAgo(r.created_at)}</div>
            ${comment}
            ${staffTag ? `<div>${staffTag}</div>` : ""}
        </div>`;
    }).join("");
}

// ── Render QR code ───────────────────────────────
function renderQR(qrCode) {
    const wrapper = document.getElementById("qrWrapper");
    if (!qrCode) {
        wrapper.innerHTML = `
            <div class="empty-state">
                <p>QR code not generated yet.<br>Re-create your business to generate one.</p>
            </div>`;
        return;
    }
    wrapper.innerHTML = `
        <img src="${qrCode}" alt="Your QR Code">
        <p class="qr-hint">Customers scan this to leave a review. Print it and place it at your counter.</p>
        <a class="qr-download" href="${qrCode}" download="thecustomer-qr.png">Download PNG</a>`;
}

// ── Load dashboard data ──────────────────────────
async function loadDashboard() {
    try {
        const dashRes = await apiFetch("/dashboard");
        if (!dashRes) return; // 401 → already redirected

        if (dashRes.status === 404) {
            hideEl("loadingState");
            showEl("setupScreen");
            return;
        }

        if (!dashRes.ok) {
            throw new Error("Failed to load dashboard.");
        }

        const dash = await dashRes.json();

        // Fetch QR code separately
        const bizRes = await apiFetch("/business");
        const bizData = (bizRes && bizRes.ok) ? await bizRes.json() : null;

        // Populate header
        document.getElementById("dashBizName").textContent = dash.business.business_name.toUpperCase();
        document.getElementById("dashBizType").textContent = dash.business.business_type;

        // Stats
        document.getElementById("statTotal").textContent = dash.stats.total_reviews;
        const avg = dash.stats.avg_business_rating;
        document.getElementById("statAvg").textContent = avg || "—";
        document.getElementById("statStars").textContent = avg ? starsDisplay(avg) : "no ratings yet";
        document.getElementById("statStaff").textContent = (dash.staff_leaderboard || []).length;

        // Leaderboard, reviews, QR
        renderLeaderboard(dash.staff_leaderboard);
        renderReviews(dash.recent_reviews);
        renderQR(bizData ? bizData.business.qr_code : null);

        hideEl("loadingState");
        showEl("dashContent");

    } catch (err) {
        hideEl("loadingState");
        document.querySelector(".app-main").innerHTML = `
            <div class="empty-state" style="padding:4rem 0">
                <p style="color:#b91c1c">Error: ${err.message}</p>
            </div>`;
    }
}

// ── Business setup form ──────────────────────────
document.getElementById("setupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name    = document.getElementById("bizName").value.trim();
    const type    = document.getElementById("bizType").value.trim();
    const phone   = document.getElementById("bizPhone").value.trim();
    const address = document.getElementById("bizAddress").value.trim();

    document.getElementById("setupBtnText").classList.add("hidden");
    document.getElementById("setupBtnLoader").classList.remove("hidden");
    document.getElementById("setupBtn").disabled = true;

    const res = await apiFetch("/business", {
        method: "POST",
        body: JSON.stringify({
            business_name: name,
            business_type: type,
            phone,
            address,
        }),
    });

    document.getElementById("setupBtnText").classList.remove("hidden");
    document.getElementById("setupBtnLoader").classList.add("hidden");
    document.getElementById("setupBtn").disabled = false;

    if (!res) return;

    if (!res.ok) {
        const data = await res.json();
        const msg  = data.errors ? data.errors[0].msg : data.message;
        showAlert("setupAlert", msg, "error");
        return;
    }

    // Success — reload the dashboard
    hideEl("setupScreen");
    showEl("loadingState");
    loadDashboard();
});

// ── All Reviews Drawer ───────────────────────────
let reviewsPage      = 1;
let reviewsTotalPages = 1;

async function openReviewsDrawer() {
    reviewsPage      = 1;
    reviewsTotalPages = 1;

    showEl("reviewsDrawer");
    document.body.style.overflow = "hidden";

    document.getElementById("reviewsDrawerContent").innerHTML = `
        <div class="drawer-name" style="margin-bottom:0.35rem">All Reviews</div>
        <div class="drawer-position" style="margin-bottom:1.75rem">Every review your business has received</div>
        <div class="drawer-reviews-label">Reviews</div>
        <div id="allReviewsList" class="drawer-reviews">
            <div class="loading-state" style="min-height:120px"><div class="spinner"></div></div>
        </div>`;

    loadAllReviews(true);
}

async function loadAllReviews(fresh) {
    if (fresh) reviewsPage = 1;

    const res = await apiFetch(`/dashboard/reviews?page=${reviewsPage}&limit=15`);
    if (!res || !res.ok) return;

    const data = await res.json();
    reviewsTotalPages = data.total_pages;

    const container = document.getElementById("allReviewsList");
    const oldBtn = document.getElementById("reviewsLoadMore");
    if (oldBtn) oldBtn.remove();

    if (fresh) container.innerHTML = "";

    if (data.reviews.length === 0 && fresh) {
        container.innerHTML = `<div class="empty-state" style="padding:1.5rem 0"><p>No reviews yet. Share your QR code to get started.</p></div>`;
        return;
    }

    container.insertAdjacentHTML("beforeend", data.reviews.map(r => {
        const comment = r.business_comment
            ? `<div class="review-comment">"${esc(r.business_comment)}"</div>`
            : `<div class="review-comment" style="opacity:0.4;font-style:italic">No comment left</div>`;
        const staffTag = r.staff_name
            ? `<div><span class="review-staff-tag">${esc(r.staff_name)} · ★${r.staff_rating || "?"}</span></div>`
            : "";
        return `
        <div class="review-card">
            <div class="review-stars">${starsDisplay(r.business_rating)}</div>
            <div class="review-date">${timeAgo(r.created_at)}</div>
            ${comment}
            ${staffTag}
        </div>`;
    }).join(""));

    if (reviewsPage < reviewsTotalPages) {
        const btn = document.createElement("button");
        btn.className = "drawer-load-more";
        btn.id = "reviewsLoadMore";
        btn.textContent = "Load more";
        btn.addEventListener("click", () => {
            reviewsPage++;
            btn.disabled = true;
            loadAllReviews(false);
        });
        container.after(btn);
    }
}

function closeReviewsDrawer() {
    hideEl("reviewsDrawer");
    document.body.style.overflow = "";
}

document.getElementById("btnViewAllReviews").addEventListener("click", openReviewsDrawer);
document.getElementById("reviewsDrawerClose").addEventListener("click", closeReviewsDrawer);
document.getElementById("reviewsDrawerBackdrop").addEventListener("click", closeReviewsDrawer);

// ── Staff Profile Drawer ─────────────────────────
let drawerStaffId   = null;
let drawerPage      = 1;
let drawerTotalPages = 1;

function openStaffDrawer(dataset) {
    const { staffId, staffName, staffPosition, staffAvg, staffTotal } = dataset;
    drawerStaffId    = staffId;
    drawerPage       = 1;
    drawerTotalPages = 1;

    showEl("staffDrawer");
    document.body.style.overflow = "hidden";

    const initials = staffName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

    document.getElementById("drawerContent").innerHTML = `
        <div class="drawer-profile">
            <div class="drawer-avatar">${initials}</div>
            <div>
                <div class="drawer-name">${esc(staffName)}</div>
                <div class="drawer-position">${esc(staffPosition)}</div>
            </div>
        </div>
        <div class="drawer-stats">
            <div class="drawer-stat">
                <div class="drawer-stat-label">Avg Rating</div>
                <div class="drawer-stat-value">${Number(staffAvg) > 0 ? staffAvg : "—"}</div>
            </div>
            <div class="drawer-stat">
                <div class="drawer-stat-label">Total Reviews</div>
                <div class="drawer-stat-value">${staffTotal}</div>
            </div>
        </div>
        <div class="drawer-reviews-label">All Reviews</div>
        <div id="drawerReviews" class="drawer-reviews">
            <div class="loading-state" style="min-height:120px"><div class="spinner"></div></div>
        </div>`;

    loadDrawerReviews(true);
}

async function loadDrawerReviews(fresh) {
    if (fresh) drawerPage = 1;

    const res = await apiFetch(`/dashboard/staff/${drawerStaffId}/reviews?page=${drawerPage}&limit=10`);
    if (!res || !res.ok) return;

    const data = await res.json();
    drawerTotalPages = data.total_pages;

    const container = document.getElementById("drawerReviews");
    const oldBtn = document.getElementById("drawerLoadMore");
    if (oldBtn) oldBtn.remove();

    if (fresh) container.innerHTML = "";

    if (data.reviews.length === 0 && fresh) {
        container.innerHTML = `<div class="empty-state" style="padding:1.5rem 0"><p>No reviews yet for this staff member.</p></div>`;
        return;
    }

    container.insertAdjacentHTML("beforeend", data.reviews.map(r => {
        const rating  = r.staff_rating || r.business_rating;
        const comment = r.staff_comment
            ? `<div class="review-comment">"${esc(r.staff_comment)}"</div>`
            : `<div class="review-comment" style="opacity:0.4;font-style:italic">No comment left</div>`;
        return `
        <div class="review-card">
            <div class="review-stars">${starsDisplay(rating)}</div>
            <div class="review-date">${timeAgo(r.created_at)}</div>
            ${comment}
        </div>`;
    }).join(""));

    if (drawerPage < drawerTotalPages) {
        const btn = document.createElement("button");
        btn.className = "drawer-load-more";
        btn.id = "drawerLoadMore";
        btn.textContent = "Load more";
        btn.addEventListener("click", () => {
            drawerPage++;
            btn.disabled = true;
            loadDrawerReviews(false);
        });
        container.after(btn);
    }
}

function closeStaffDrawer() {
    hideEl("staffDrawer");
    document.body.style.overflow = "";
}

// Leaderboard click delegation
document.getElementById("leaderboard").addEventListener("click", (e) => {
    const row = e.target.closest(".leader-row");
    if (row) openStaffDrawer(row.dataset);
});

document.getElementById("leaderboard").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
        const row = e.target.closest(".leader-row");
        if (row) { e.preventDefault(); openStaffDrawer(row.dataset); }
    }
});

document.getElementById("drawerClose").addEventListener("click", closeStaffDrawer);
document.getElementById("drawerBackdrop").addEventListener("click", closeStaffDrawer);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeStaffDrawer();
        closeReviewsDrawer();
    }
});

// ── Boot ─────────────────────────────────────────
loadDashboard();
