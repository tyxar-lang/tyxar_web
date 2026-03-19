// Tyxar Dashboard Sidebar & Mobile Logic

document.addEventListener('DOMContentLoaded', function () {
    // Sidebar mobile toggle
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');
    if (sidebarToggleBtn && sidebar && sidebarCloseBtn) {
        sidebarToggleBtn.onclick = function () {
            sidebar.classList.add('open');
        };
        sidebarCloseBtn.onclick = function () {
            sidebar.classList.remove('open');
        };
        // Close sidebar on outside click (mobile)
        document.addEventListener('click', function (e) {
            if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
                sidebar.classList.remove('open');
            }
        });
    }

    // Show user info in sidebar
    if (window.supabaseClient) {
        supabaseClient.auth.getUser().then(({ data }) => {
            if (data && data.user) {
                const user = data.user;
                let name = (user.user_metadata && (user.user_metadata.first_name || user.user_metadata.last_name))
                    ? `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim()
                    : (user.email || '');
                document.getElementById('sidebar-user').textContent = `Signed in as: ${name}`;
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async function (e) {
            e.preventDefault();
            if (window.supabaseClient) {
                await supabaseClient.auth.signOut();
                localStorage.removeItem('tyxar_user');
                window.location.replace('/tyxar_web/profile/index.html');
            }
        };
    }
});
