
// --- Tyxar Auth Logic ---
// Use supabaseClient from config.js

document.addEventListener('DOMContentLoaded', function () {
    // Only run auth logic if on profile page
    if (document.getElementById('signin-dialog')) {
        const signinDialog = document.getElementById('signin-dialog');
        const signupDialog = document.getElementById('signup-dialog');
        document.getElementById('show-signup').onclick = function (e) {
            e.preventDefault();
            signinDialog.style.display = 'none';
            signupDialog.style.display = 'flex';
        };
        document.getElementById('show-signin').onclick = function (e) {
            e.preventDefault();
            signupDialog.style.display = 'none';
            signinDialog.style.display = 'flex';
        };

        // Sign in with email/password
        document.getElementById('signin-form').onsubmit = async function (e) {
            e.preventDefault();
            const email = document.getElementById('signin-email').value.trim();
            const password = document.getElementById('signin-password').value;
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                if (error) return showAuthError(error.message);
                // Save user info to localStorage for dashboard
                if (data && data.user) {
                    localStorage.setItem('tyxar_user', JSON.stringify(data.user));
                }
                window.location.href = '/tyxar_web/profile/dashboard/index.html';
            } catch (err) {
                showAuthError('Sign in failed.');
            }
        };

        // Sign up with email/password
        document.getElementById('signup-form').onsubmit = async function (e) {
            e.preventDefault();
            const email = document.getElementById('signup-email').value.trim();
            const password = document.getElementById('signup-password').value;
            const firstName = document.getElementById('signup-firstname').value.trim();
            const lastName = document.getElementById('signup-lastname').value.trim();
            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: { data: { first_name: firstName, last_name: lastName } }
                });
                if (error) return showAuthError(error.message);
                if (data && data.user) {
                    localStorage.setItem('tyxar_user', JSON.stringify(data.user));
                }
                window.location.href = '/tyxar_web/profile/dashboard/index.html';
            } catch (err) {
                showAuthError('Registration failed.');
            }
        };

        // Google/GitHub OAuth
        function oauth(provider) {
            supabaseClient.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/tyxar_web/profile/dashboard/index.html' } })
                .catch(() => showAuthError('OAuth failed.'));
        }
        document.getElementById('google-signin').onclick = function (e) { e.preventDefault(); oauth('google'); };
        document.getElementById('github-signin').onclick = function (e) { e.preventDefault(); oauth('github'); };
        document.getElementById('google-signup').onclick = function (e) { e.preventDefault(); oauth('google'); };
        document.getElementById('github-signup').onclick = function (e) { e.preventDefault(); oauth('github'); };
    }

    // Dashboard: Show user name if available
    if (document.body && window.location.pathname.includes('/profile/dashboard/index.html')) {
        let user = null;
        // Try to get from localStorage first
        try {
            user = JSON.parse(localStorage.getItem('tyxar_user'));
        } catch { }
        // If not found, get from supabase
        if (!user) {
            supabaseClient.auth.getUser().then(({ data }) => {
                if (data && data.user) {
                    user = data.user;
                    localStorage.setItem('tyxar_user', JSON.stringify(user));
                    showDashboardUser(user);
                }
            });
        } else {
            showDashboardUser(user);
        }
    }
});

function showAuthError(msg) {
    let err = document.getElementById('auth-error');
    if (!err) {
        err = document.createElement('div');
        err.id = 'auth-error';
        err.style.color = '#d32f2f';
        err.style.textAlign = 'center';
        err.style.margin = '0.5em 0 0.2em 0';
        err.style.fontWeight = '500';
        const dialog = document.querySelector('.auth-dialog[style*="display: flex"]') || document.querySelector('.auth-dialog');
        dialog.insertBefore(err, dialog.firstChild.nextSibling);
    }
    err.textContent = msg;
}

function showDashboardUser(user) {
    if (!user) return;
    let name = (user.user_metadata && (user.user_metadata.first_name || user.user_metadata.last_name))
        ? `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim()
        : (user.email || '');
    let dash = document.getElementById('dashboard-user-info');
    if (!dash) {
        dash = document.createElement('div');
        dash.id = 'dashboard-user-info';
        dash.style.fontSize = '1.15rem';
        dash.style.fontWeight = '600';
        dash.style.margin = '2.5rem auto 0 auto';
        dash.style.textAlign = 'center';
        document.body.prepend(dash);
    }
    dash.textContent = `Welcome, ${name}!`;
}