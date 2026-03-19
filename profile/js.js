
// --- Tyxar Auth Logic ---
// Assumes Supabase client is initialized as 'supabase' in config.js

document.addEventListener('DOMContentLoaded', function () {
    // Switch between sign in and sign up dialogs
    const signinDialog = document.getElementById('signin-dialog');
    const signupDialog = document.getElementById('signup-dialog');
    document.getElementById('show-signup').onclick = function(e) {
        e.preventDefault();
        signinDialog.style.display = 'none';
        signupDialog.style.display = 'flex';
    };
    document.getElementById('show-signin').onclick = function(e) {
        e.preventDefault();
        signupDialog.style.display = 'none';
        signinDialog.style.display = 'flex';
    };

    // Sign in with email/password
    document.getElementById('signin-form').onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return showAuthError(error.message);
            window.location.href = '/tyxar_web/dashboard/index.html';
        } catch (err) {
            showAuthError('Sign in failed.');
        }
    };

    // Sign up with email/password
    document.getElementById('signup-form').onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const firstName = document.getElementById('signup-firstname').value.trim();
        const lastName = document.getElementById('signup-lastname').value.trim();
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { first_name: firstName, last_name: lastName } }
            });
            if (error) return showAuthError(error.message);
            window.location.href = '/tyxar_web/dashboard/index.html';
        } catch (err) {
            showAuthError('Registration failed.');
        }
    };

    // Google OAuth (sign in/up)
    function oauth(provider) {
        supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin + '/tyxar_web/dashboard/index.html' } })
            .catch(() => showAuthError('OAuth failed.'));
    }
    document.getElementById('google-signin').onclick = function(e) { e.preventDefault(); oauth('google'); };
    document.getElementById('github-signin').onclick = function(e) { e.preventDefault(); oauth('github'); };
    document.getElementById('google-signup').onclick = function(e) { e.preventDefault(); oauth('google'); };
    document.getElementById('github-signup').onclick = function(e) { e.preventDefault(); oauth('github'); };
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