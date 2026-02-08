
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

    const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    authStatus.textContent = error
        ? error.message
        : "Logged in.";

    loadUser();
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
// PROFILE UPDATE FUNCTION
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

    // Populate dashboard
    const displayName = user.user_metadata?.full_name || user.user_metadata?.user_name || user.user_metadata?.name || 'User';
    dashboardName.textContent = displayName;
    dashboardEmail.textContent = user.email;
    dashboardCreated.textContent = new Date(user.created_at).toLocaleDateString();

    // Also populate settings form fields
    const settingNameInput = document.getElementById('settingName');
    const settingEmailInput = document.getElementById('settingEmail');
    if (settingNameInput) settingNameInput.value = displayName;
    if (settingEmailInput) settingEmailInput.value = user.email;

    // Fetch boolean role flags from profiles table
    const { data: profile } = await supabaseClient
        .from("profiles")
        .select("is_user, is_admin, is_developer, is_tester")
        .eq("id", user.id)
        .single();

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