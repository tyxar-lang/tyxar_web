// Profile Dashboard Script
// Handles sidebar loading and dynamic content switching

async function initializeProfileDashboard(user) {
    try {
        // Load sidebar
        const sidebarResp = await fetch('sidebar.html');
        if (sidebarResp.ok) {
            const sidebarHtml = await sidebarResp.text();
            document.getElementById('profile-sidebar').innerHTML = sidebarHtml;
        }

        // Load default content (overview)
        await loadContent('overview');

        // Set up event listeners for sidebar navigation
        setupSidebarNavigation();

    } catch (error) {
        console.error('Error initializing profile dashboard:', error);
    }
}

async function loadContent(page) {
    try {
        const contentResp = await fetch(`${page}.html`);
        if (contentResp.ok) {
            const contentHtml = await contentResp.text();
            document.getElementById('main-content').innerHTML = contentHtml;

            // Update URL without page reload
            const newUrl = `/tyxar_web/profile/${page}`;
            window.history.pushState({ page }, '', newUrl);

            // Update active sidebar item
            updateActiveSidebarItem(page);

        } else {
            console.error(`Failed to load content for page: ${page}`);
            document.getElementById('main-content').innerHTML = '<p>Error loading content.</p>';
        }
    } catch (error) {
        console.error('Error loading content:', error);
        document.getElementById('main-content').innerHTML = '<p>Error loading content.</p>';
    }
}

function setupSidebarNavigation() {
    const sidebar = document.getElementById('profile-sidebar');

    sidebar.addEventListener('click', async (event) => {
        const link = event.target.closest('[data-page]');
        if (link) {
            event.preventDefault();
            const page = link.getAttribute('data-page');

            if (page === 'logout') {
                // Handle logout
                if (typeof logout === 'function') {
                    logout();
                }
                return;
            }

            await loadContent(page);
        }
    });
}

function updateActiveSidebarItem(activePage) {
    const sidebar = document.getElementById('profile-sidebar');
    const links = sidebar.querySelectorAll('[data-page]');

    links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === activePage) {
            link.classList.add('active');
        }
    });
}

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
    if (event.state && event.state.page) {
        loadContent(event.state.page);
    }
});