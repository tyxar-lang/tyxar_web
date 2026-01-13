
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

    const {error} = await supabaseClient.auth.signUp({
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

    const {error} = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    authStatus.textContent = error
    ? error.message
    : "Logged in.";

    loadUser();
}

    async function loginWithGitHub() {
    const {error} = await supabaseClient.auth.signInWithOAuth({
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
    const {error} = await supabaseClient.auth.signInWithOAuth({
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
    const {data} = await supabaseClient.auth.getUser();
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

    // Fetch is_admin from profiles table
    const {data: profile } = await supabaseClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

    dashboardRole.textContent = profile?.is_admin ? "Admin" : "User";

    // Show dashboard, hide auth
    authBox.classList.add("hidden");
    dashboard.classList.remove("hidden");

    // Load default page (overview)
    loadPageContent('overview');

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
        const {data: {session} } = await supabaseClient.auth.getSession();
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
                // AND the sidebar links (since they use the global selector now)
                initializeContentLoader();
            })
            .catch(err => console.error(`Error loading ${url}:`, err));
    }

    // Function to load page content
    function loadPageContent(page) {
        // Hide all content divs
        document.querySelectorAll('.page-container').forEach(div => div.classList.add('hidden'));
        // Hide the default dashboard-main
        document.querySelector('.dashboard-main').classList.add('hidden');

        // Show the selected content
        const contentDiv = document.getElementById(page + '-content');
        if (contentDiv) {
            fetch(`/tyxar_web/profile/${page}.html`)
                .then(response => response.text())
                .then(data => {
                    contentDiv.innerHTML = data;
                    contentDiv.classList.remove('hidden');
                    // Populate dynamic data if needed
                    if (page === 'account') {
                        populateAccountData();
                    }
                })
                .catch(err => console.error(`Error loading ${page}.html:`, err));
        }
    }

    // Function to populate account data
    async function populateAccountData() {
        const {data} = await supabaseClient.auth.getUser();
        const user = data.user;
        if (user) {
            document.getElementById('accountName').textContent = user.user_metadata?.full_name || user.user_metadata?.user_name || user.user_metadata?.name || 'User';
            document.getElementById('accountEmail').textContent = user.email;
            document.getElementById('accountCreated').textContent = new Date(user.created_at).toLocaleDateString();

            // Fetch is_admin from profiles table
            const {data: profile } = await supabaseClient
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .single();

            document.getElementById('accountRole').textContent = profile?.is_admin ? "Admin" : "User";
        }
    }

    // Event listener for sidebar clicks
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-page]')) {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            loadPageContent(page);
        }
    });

    // Call these functions when the main page loads:
    document.addEventListener('DOMContentLoaded', (event) => {
        // Load Header, Footer, and Sidebar
        loadHTML('/tyxar_web/header.html', 'header');
    loadHTML('/tyxar_web/footer.html', 'footer');

    // If sidebar is only used in the 'doc' index.html, call it conditionally:
    if (document.getElementById('sidebar')) {
        loadHTML('/tyxar_web/profile/sidebar.html ', 'sidebar');
        }
    });
