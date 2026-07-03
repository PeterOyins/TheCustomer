requireAuth();

// ── Helpers ─────────────────────────────────────
function hideEl(id) { document.getElementById(id).classList.add("hidden"); }
function showEl(id) { document.getElementById(id).classList.remove("hidden"); }

function esc(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showAddAlert(msg, type) {
    const el = document.getElementById("addAlert");
    el.textContent = msg;
    el.className = `alert ${type}`;
}

function initials(name) {
    return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── Render staff list ────────────────────────────
function renderStaff(list) {
    const container = document.getElementById("staffList");
    const subtitle  = document.getElementById("staffSubtitle");

    subtitle.textContent = `${list.length} team member${list.length !== 1 ? "s" : ""}`;

    if (list.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="background:var(--ice);border-radius:1.5rem;padding:3rem">
                <div class="empty-icon">👥</div>
                <p>No staff members yet.<br>Add your first team member above.</p>
            </div>`;
        return;
    }

    container.innerHTML = list.map(s => `
        <div class="staff-card" id="card-${s.id}">
            <div class="staff-card-row">
                <div class="staff-avatar">${initials(s.name)}</div>
                <div class="staff-info">
                    <div class="staff-name">${esc(s.name)}</div>
                    <div class="staff-pos">${esc(s.position)}</div>
                </div>
                <span class="staff-status ${esc(s.status)}">${esc(s.status)}</span>
                <div class="staff-actions">
                    <button class="btn-sm btn-edit"   data-action="edit"   data-id="${s.id}">Edit</button>
                    <button class="btn-sm ${s.status === 'active' ? 'btn-deact' : 'btn-act'}"
                            data-action="toggle" data-id="${s.id}" data-status="${esc(s.status)}">
                        ${s.status === "active" ? "Deactivate" : "Activate"}
                    </button>
                    <button class="btn-sm btn-delete" data-action="delete" data-id="${s.id}" data-name="${esc(s.name)}">Delete</button>
                </div>
            </div>
            <!-- Inline edit form -->
            <div class="staff-edit-form" id="edit-${s.id}">
                <div id="editAlert-${s.id}" class="alert hidden"></div>
                <div class="two-fields">
                    <div class="field">
                        <label>Name</label>
                        <input type="text" id="editName-${s.id}" value="${esc(s.name)}">
                    </div>
                    <div class="field">
                        <label>Position</label>
                        <input type="text" id="editPos-${s.id}" value="${esc(s.position)}">
                    </div>
                </div>
                <div style="display:flex;gap:0.5rem;margin-top:0.25rem">
                    <button class="btn-submit" style="font-size:0.65rem;padding:0.7rem 1.25rem;width:auto"
                            data-action="save" data-id="${s.id}">Save Changes</button>
                    <button class="btn-sm btn-edit" style="padding:0.6rem 1rem"
                            data-action="cancel" data-id="${s.id}">Cancel</button>
                </div>
            </div>
        </div>
    `).join("");

    // Event delegation — replaces all inline onclick handlers
    container.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;
        const { action, id, status, name } = btn.dataset;
        const numId = Number(id);
        if (action === "edit")   openEdit(numId);
        if (action === "cancel") closeEdit(numId);
        if (action === "save")   saveEdit(numId);
        if (action === "toggle") toggleStatus(numId, status);
        if (action === "delete") deleteStaff(numId, name);
    });
}

// ── Edit helpers ─────────────────────────────────
function openEdit(id) {
    // Close any other open edit forms
    document.querySelectorAll(".staff-edit-form.open").forEach(f => f.classList.remove("open"));
    document.getElementById(`edit-${id}`).classList.add("open");
}

function closeEdit(id) {
    document.getElementById(`edit-${id}`).classList.remove("open");
}

async function saveEdit(id) {
    const name     = document.getElementById(`editName-${id}`).value.trim();
    const position = document.getElementById(`editPos-${id}`).value.trim();
    const alertEl  = document.getElementById(`editAlert-${id}`);

    if (!name || !position) {
        alertEl.textContent = "Name and position are required.";
        alertEl.className = "alert error";
        return;
    }

    const res = await apiFetch(`/staff/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, position }),
    });

    if (!res) return;

    if (!res.ok) {
        const data = await res.json();
        alertEl.textContent = data.message || "Update failed.";
        alertEl.className = "alert error";
        return;
    }

    loadStaff();
}

// ── Toggle status ────────────────────────────────
async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const res = await apiFetch(`/staff/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
    });
    if (!res) return;
    if (res.ok) loadStaff();
}

// ── Delete staff ─────────────────────────────────
async function deleteStaff(id, name) {
    if (!confirm(`Remove ${name} from your team? This cannot be undone.`)) return;

    const res = await apiFetch(`/staff/${id}`, { method: "DELETE" });
    if (!res) return;
    if (res.ok) loadStaff();
}

// ── Load staff ───────────────────────────────────
async function loadStaff() {
    const res = await apiFetch("/staff");
    if (!res) return;

    if (res.status === 404) {
        // No business yet — redirect to dashboard to set it up
        window.location.href = "/dashboard.html";
        return;
    }

    if (!res.ok) {
        document.getElementById("staffList").innerHTML = `
            <div class="empty-state"><p>Failed to load staff.</p></div>`;
        hideEl("loadingState");
        showEl("pageContent");
        return;
    }

    const data = await res.json();
    renderStaff(data.staff || []);
    hideEl("loadingState");
    showEl("pageContent");
}

// ── Add staff form ───────────────────────────────
document.getElementById("addStaffForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name     = document.getElementById("staffName").value.trim();
    const position = document.getElementById("staffPosition").value.trim();

    document.getElementById("addBtnText").classList.add("hidden");
    document.getElementById("addBtnLoader").classList.remove("hidden");
    document.getElementById("addBtn").disabled = true;

    const res = await apiFetch("/staff", {
        method: "POST",
        body: JSON.stringify({ name, position }),
    });

    document.getElementById("addBtnText").classList.remove("hidden");
    document.getElementById("addBtnLoader").classList.add("hidden");
    document.getElementById("addBtn").disabled = false;

    if (!res) return;

    if (!res.ok) {
        const data = await res.json();
        const msg  = data.errors ? data.errors[0].msg : data.message;
        showAddAlert(msg, "error");
        return;
    }

    // Clear form and reload list
    document.getElementById("staffName").value = "";
    document.getElementById("staffPosition").value = "";
    showAddAlert(`${name} added successfully.`, "success");
    setTimeout(() => { document.getElementById("addAlert").className = "alert hidden"; }, 3000);
    loadStaff();
});

// ── Boot ─────────────────────────────────────────
loadStaff();
