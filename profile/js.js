
// ===============================
// ELEMENTS
// ===============================
const authBox = document.querySelector(".box");
const dashboard = document.getElementById("dashboard");
const authStatus = document.getElementById("authStatus");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupNameInput = document.getElementById("signupName");
const signupEmailInput = document.getElementById("signupEmail");
const signupPasswordInput = document.getElementById("signupPassword");

const dashboardName = document.getElementById("dashboardName");
const dashboardEmail = document.getElementById("dashboardEmail");
const dashboardRole = document.getElementById("dashboardRole");
const dashboardCreated = document.getElementById("dashboardCreated");

// ===============================
// AUTH FUNCTIONS
// ===============================
async function signup() {
    const name = signupNameInput.value;
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    const { error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name
            }
        }
    });

    authStatus.textContent = error
        ? error.message
        : "Check your email to confirm signup.";
}

async function login() {
    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        const result = await supabaseClient.auth.signInWithPassword({ email, password });
        const { data, error } = result;

        if (error) {
            authStatus.textContent = error.message;
            console.error('Sign-in error:', error);
            return;
        }

        authStatus.textContent = 'Logged in.';
        // Log session state for debugging persistence
        const session = await supabaseClient.auth.getSession();
        console.debug('Post-login session:', session);

        // Load user details and UI
        await loadUser();
    } catch (err) {
        console.error('Unexpected login error:', err);
        authStatus.textContent = 'Login failed';
    }
}

async function loginWithGitHub() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: 'https://tyxar-lang.github.io/tyxar_web/auth/callback.html'
        }
    });

    authStatus.textContent = error
        ? error.message
        : "Redirecting to GitHub...";
}

async function loginWithGoogle() {
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://tyxar-lang.github.io/tyxar_web/auth/callback.html'
        }
    });

    authStatus.textContent = error
        ? error.message
        : "Redirecting to Google...";
}

async function logout() {
    await supabaseClient.auth.signOut();
    showAuth();
}

// ===============================
// ADMIN USER TABLE & ROLE MANAGEMENT
// ===============================
async function loadAdminUserTable() {
    const adminTableBody = document.getElementById('adminTableBody');
    if (!adminTableBody) return; // Not an admin, table doesn't exist

    const pageSize = 50; // quick initial page for perceived speed

    // Helper to render rows and append
    function appendProfilesRows(profiles) {
        if (!profiles || profiles.length === 0) return;
        const rows = profiles.map(profile => `
            <tr style="border-bottom: 1px solid #cbd5e0;">
                <td style="padding: 12px; color: #2d3748; font-weight: 500;">${profile.full_name || 'Unknown'}</td>
                <td style="padding: 12px; text-align: center;">
                    <input type="checkbox" ${profile.is_admin ? 'checked' : ''} onchange="toggleUserRole('${profile.id}', 'is_admin', this.checked)" style="cursor: pointer; width: 18px; height: 18px;">
                </td>
                <td style="padding: 12px; text-align: center;">
                    <input type="checkbox" ${profile.is_developer ? 'checked' : ''} onchange="toggleUserRole('${profile.id}', 'is_developer', this.checked)" style="cursor: pointer; width: 18px; height: 18px;">
                </td>
                <td style="padding: 12px; text-align: center;">
                    <input type="checkbox" ${profile.is_tester ? 'checked' : ''} onchange="toggleUserRole('${profile.id}', 'is_tester', this.checked)" style="cursor: pointer; width: 18px; height: 18px;">
                </td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="viewUserDetails('${profile.id}')" style="padding: 6px 12px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">View</button>
                </td>
            </tr>
        `).join('');
        adminTableBody.insertAdjacentHTML('beforeend', rows);
    }

    try {
        // Get current user id for debug/hinting (helps detect RLS issues)
        const { data: currentUserData } = await supabaseClient.auth.getUser();
        const currentUserId = currentUserData?.user?.id;
        // Show skeleton is already present in HTML; fetch only first page quickly
        const start = 0;
        const end = pageSize - 1;
        const { data: firstPage, error: firstErr } = await supabaseClient
            .from('profiles')
            .select('id, full_name, is_admin, is_developer, is_tester, is_user')
            .order('created_at', { ascending: false })
            .range(start, end);

        if (firstErr) {
            console.error('Error fetching first page:', firstErr);
            adminTableBody.innerHTML = '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #e53e3e;">Error loading users. Please try again.</td></tr>';
            return;
        }

        if (!firstPage || firstPage.length === 0) {
            adminTableBody.innerHTML = '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #718096;">No users found</td></tr>';
            return;
        }

        // Clear skeleton and render first page immediately
        adminTableBody.innerHTML = '';
        appendProfilesRows(firstPage);

        // Debug: log how many rows returned for admin table
        console.debug('Admin table: firstPage length =', firstPage?.length);

        // If we only see a single row and that row is the current user,
        // it's likely Row-Level Security is restricting the query to self.
        if (firstPage.length === 1 && currentUserId && firstPage[0].id === currentUserId) {
            // RLS likely limiting results; debug logged but no UI hint shown.
            console.warn('Admin table appears to be limited to current user; check RLS policies.');
        }

        // If we received a full page, load remaining pages in background
        if (firstPage.length === pageSize) {
            // show loading-more row
            const loadingRowId = 'admin-loading-more';
            adminTableBody.insertAdjacentHTML('beforeend', `<tr id="${loadingRowId}"><td colspan="5" style="padding:12px; text-align:center; color:#718096;">Loading more users...</td></tr>`);

            // Fetch subsequent pages asynchronously without blocking UI
            (async () => {
                let offset = pageSize;
                while (true) {
                    const { data: page, error: pgErr } = await supabaseClient
                        .from('profiles')
                        .select('id, full_name, is_admin, is_developer, is_tester, is_user')
                        .order('created_at', { ascending: false })
                        .range(offset, offset + pageSize - 1);

                    if (pgErr) {
                        console.error('Error fetching page:', pgErr);
                        break;
                    }

                    if (!page || page.length === 0) break;

                    // remove loading-more placeholder before appending
                    const loadingEl = document.getElementById(loadingRowId);
                    if (loadingEl) loadingEl.remove();

                    appendProfilesRows(page);

                    // add loading placeholder again if likely more
                    adminTableBody.insertAdjacentHTML('beforeend', `<tr id="${loadingRowId}"><td colspan="5" style="padding:12px; text-align:center; color:#718096;">Loading more users...</td></tr>`);

                    offset += pageSize;
                    // small delay to avoid hammering DB
                    await new Promise(r => setTimeout(r, 150));
                }

                // cleanup loading row
                const loadingEl = document.getElementById('admin-loading-more');
                if (loadingEl) loadingEl.remove();
            })();
        }

    } catch (err) {
        console.error('Error in loadAdminUserTable:', err);
        adminTableBody.innerHTML = '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #e53e3e;">Error loading table</td></tr>';
    }
}

async function toggleUserRole(userId, roleField, isChecked) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({ [roleField]: isChecked })
            .eq('id', userId);

        if (error) {
            alert(`Error updating role: ${error.message}`);
            // Reload to revert the checkbox
            loadAdminUserTable();
        } else {
            // Successful update - checkbox stays as is
            console.log(`Updated ${roleField} for user ${userId} to ${isChecked}`);
        }
    } catch (err) {
        console.error('Error toggling role:', err);
        alert('Error updating role');
        loadAdminUserTable();
    }
}

function viewUserDetails(userId) {
    alert(`Viewing details for user: ${userId}`);
    // This can be expanded later to show more detailed view
}

async function loadAdminPendingRequests() {
    const pendingRequestsBody = document.getElementById('adminPendingRequestsBody');
    if (!pendingRequestsBody) return; // Not an admin

    try {
        // Fetch all pending role requests (optimized)
        const { data: requests, error } = await supabaseClient
            .from('role_requests')
            .select('id, user_id, requested_role, created_at, status')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(100); // Limit for performance

        if (error) {
            console.error('Error fetching requests:', error);
            pendingRequestsBody.innerHTML = '<div style="padding: 12px; text-align: center; color: #e53e3e;">Error loading requests</div>';
            return;
        }

        if (!requests || requests.length === 0) {
            pendingRequestsBody.innerHTML = '<div style="padding: 12px; text-align: center; color: #718096;">No pending requests</div>';
            return;
        }

        // For each request, fetch user's full_name from profiles (optimized with Promise.all)
        const requestsWithNames = await Promise.all(requests.map(async (req) => {
            const { data: profile } = await supabaseClient
                .from('profiles')
                .select('full_name')
                .eq('id', req.user_id)
                .single();
            return { ...req, userName: profile?.full_name || 'Unknown' };
        }));

        // Build request cards immediately
        pendingRequestsBody.innerHTML = requestsWithNames.map(req => `
            <div style="border: 2px solid #f6ad55; border-radius: 8px; padding: 16px; background: #fffaf0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: 700; color: #2d3748; margin-bottom: 4px;">${req.userName}</div>
                    <div style="font-size: 0.9rem; color: #718096;">Requested <strong>${req.requested_role.charAt(0).toUpperCase() + req.requested_role.slice(1)}</strong> on ${new Date(req.created_at).toLocaleDateString('en-GB')}</div>
                </div>
                <button id="approveBtn-${req.id}" onclick="approveRoleRequest('${req.id}', '${req.user_id}', '${req.requested_role}', this)" style="padding: 8px 16px; background: #38a169; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; white-space: nowrap; margin-left: 12px; transition: all 0.2s ease;" onmouseover="this.style.background='#2f855a'" onmouseout="this.style.background='#38a169'">✓ Approve</button>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error in loadAdminPendingRequests:', err);
        pendingRequestsBody.innerHTML = '<div style="padding: 12px; text-align: center; color: #e53e3e;">Error loading requests</div>';
    }
}

async function approveRoleRequest(requestId, userId, roleName, buttonEl) {
    try {
        // Update the user's role flag in profiles table
        const roleField = `is_${roleName}`;
        const { error: updateError } = await supabaseClient
            .from('profiles')
            .update({ [roleField]: true })
            .eq('id', userId);

        if (updateError) {
            alert(`Error approving request: ${updateError.message}`);
            return;
        }

        // Mark the request as approved or delete it
        const { error: deleteError } = await supabaseClient
            .from('role_requests')
            .delete()
            .eq('id', requestId);

        if (deleteError) {
            console.error('Error deleting request:', deleteError);
        }

        // Make button inactive
        buttonEl.disabled = true;
        buttonEl.style.background = '#cbd5e0';
        buttonEl.style.cursor = 'not-allowed';
        buttonEl.textContent = '✓ Approved';
        buttonEl.style.opacity = '0.6';

        // Reload tables to reflect changes
        setTimeout(() => {
            loadAdminUserTable();
            loadAdminPendingRequests();
        }, 500);

    } catch (err) {
        console.error('Error approving request:', err);
        alert('Error approving request');
    }
}

// ===============================
// PROFILE LOAD & DASHBOARD SETUP
// ===============================

async function saveProfileChanges() {
    const user = (await supabaseClient.auth.getUser()).data.user;
    if (!user) {
        alert('You must be logged in to save changes.');
        return;
    }

    const newName = document.getElementById('settingName').value.trim();

    if (!newName) {
        alert('Please enter a name.');
        return;
    }

    // Update user metadata in auth.users
    const { error: updateError } = await supabaseClient.auth.updateUser({
        data: { full_name: newName }
    });

    if (updateError) {
        alert(`Error saving changes: ${updateError.message}`);
        console.error(updateError);
        return;
    }

    alert('✅ Profile updated successfully!');

    // Reload user data to reflect changes
    loadUser();
}

// ===============================
// FORM TOGGLE FUNCTIONS
// ===============================
function showSignup() {
    loginForm.classList.add("hidden");
    signupForm.classList.remove("hidden");
    authStatus.textContent = "";
}

function showLogin() {
    signupForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    authStatus.textContent = "";
}

function showAuth() {
    dashboard.classList.add("hidden");
    authBox.classList.remove("hidden");
    showLogin(); // Default to login form
}

// ===============================
// USER STATE
// ===============================
async function loadUser() {
    const { data } = await supabaseClient.auth.getUser();
    const user = data.user;

    if (!user) {
        showAuth();
        return;
    }

    console.debug('loadUser: auth.getUser ->', user && { id: user.id, email: user.email });

    // Populate dashboard
    const displayName = user.user_metadata?.full_name || user.user_metadata?.user_name || user.user_metadata?.name || 'User';
    dashboardName.textContent = displayName;
    dashboardEmail.textContent = user.email;
    dashboardCreated.textContent = new Date(user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

    // Also populate settings form fields
    const settingNameInput = document.getElementById('settingName');
    const settingEmailInput = document.getElementById('settingEmail');
    if (settingNameInput) settingNameInput.value = displayName;
    if (settingEmailInput) settingEmailInput.value = user.email;

    // Fetch boolean role flags from profiles table
    let { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("is_user, is_admin, is_developer, is_tester, full_name")
        .eq("id", user.id)
        .single();

    console.debug('loadUser: profiles fetch ->', { profile, profileError });

    // If profile doesn't exist yet (or fetch errored), create it and refetch
    if (!profile) {
        try {
            const { error: insertError } = await supabaseClient
                .from('profiles')
                .insert({
                    id: user.id,
                    full_name: displayName,
                    is_user: true,
                    is_admin: false,
                    is_developer: false,
                    is_tester: false
                });
            if (insertError) {
                console.error('Error creating profile:', insertError);
            } else {
                // refetch after insert
                const refetch = await supabaseClient
                    .from('profiles')
                    .select('is_user, is_admin, is_developer, is_tester, full_name')
                    .eq('id', user.id)
                    .single();
                profile = refetch.data;
                profileError = refetch.error;
                console.debug('loadUser: profiles refetch ->', { profile, profileError });
            }
        } catch (e) {
            console.error('Unexpected error creating/refetching profile:', e);
        }
    } else if (profile && profile.full_name !== displayName) {
        // Sync full_name from auth.users to profiles if they differ
        const { error: syncError } = await supabaseClient
            .from('profiles')
            .update({ full_name: displayName })
            .eq('id', user.id);
        if (syncError) console.error('Error syncing full_name:', syncError);
    }

    // Build roles array by checking each boolean flag in the profiles row
    const rolesArray = [];
    if (profile?.is_user) rolesArray.push('user');
    if (profile?.is_admin) rolesArray.push('admin');
    if (profile?.is_developer) rolesArray.push('developer');
    if (profile?.is_tester) rolesArray.push('tester');

    // Create a human-friendly display string (Title Case) while keeping the
    // canonical lowercase array available for logic/UI toggles.
    const displayRoles = rolesArray.map(r => String(r).charAt(0).toUpperCase() + String(r).slice(1));

    // Only display roles returned from Supabase. If none, show empty.
    dashboardRole.textContent = displayRoles.length ? displayRoles.join(', ') : '';

    // Also update the currentRole element (if the role UI exists on the page)
    const currentRoleEl = document.getElementById('currentRole');
    if (currentRoleEl) currentRoleEl.textContent = displayRoles.length ? displayRoles.join(', ') : '';

    // Expose roles to other scripts and allow the UI to react
    window.currentUserRoles = rolesArray;
    if (window.updateRoleUI) window.updateRoleUI(rolesArray);
    // If the current user is an admin, proactively load admin data so
    // the admin table and pending requests are populated without
    // requiring the user to click Overview a second time.
    if (rolesArray && rolesArray.indexOf('admin') !== -1) {
        if (window.loadAdminUserTable) window.loadAdminUserTable();
        if (window.loadAdminPendingRequests) window.loadAdminPendingRequests();
    }
    dashboardCreated.textContent = new Date(user.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

    // Show dashboard, hide auth
    authBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    // Load actual header and footer into the dashboard (use site's header/footer)
    try {
        const headerResp = await fetch('/tyxar_web/header.html');
        if (headerResp.ok) {
            const headerHtml = await headerResp.text();
            document.getElementById('siteHeader').innerHTML = headerHtml;
        }
    } catch (e) {
        console.warn('Could not load header:', e);
    }

    try {
        const footerResp = await fetch('/tyxar_web/footer.html');
        if (footerResp.ok) {
            const footerHtml = await footerResp.text();
            document.getElementById('siteFooter').innerHTML = footerHtml;
        }
    } catch (e) {
        console.warn('Could not load footer:', e);
    }
}

// ===============================
// INIT
// ===============================
loadUser();

// CLEANUP & SHOW ACCOUNT AFTER LOGIN

if (window.location.hash.includes('access_token')) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.debug('Auth state change:', event, session);
        loadUser();
    } else if (event === 'SIGNED_OUT') {
        showAuth();
    }
});

// Initial check in case page loads with existing session
(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) loadUser();
})();


// Function to load external HTML content
function loadHTML(url, elementId) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            document.getElementById(elementId).innerHTML = data;

            // --- CRITICAL STEP ---
            // Re-run initialization to catch the *new* links in the footer 
            initializeContentLoader();
        })
        .catch(err => console.error(`Error loading ${url}:`, err));
}

// Call these functions when the main page loads:
document.addEventListener('DOMContentLoaded', (event) => {
    // Load Header, Footer
    loadHTML('/tyxar_web/header.html', 'header');
    loadHTML('/tyxar_web/footer.html', 'footer');
});



 