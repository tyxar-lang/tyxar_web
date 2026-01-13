// Profile Dashboard Script
// Handles sidebar loading and content switching

function initializeProfileDashboard() {
    // Load sidebar into the page
    loadSidebar();

    // Initialize content switching
    initializeContentSwitching();

    // Load initial content (overview)
    loadContent('overview');
}

function loadSidebar() {
    const sidebarContainer = document.getElementById('profileSidebar');
    if (!sidebarContainer) return;

    fetch('/tyxar_web/profile/sidebar.html')
        .then(response => response.text())
        .then(html => {
            sidebarContainer.innerHTML = html;
            // Re-initialize content switching after sidebar loads
            initializeContentSwitching();
        })
        .catch(err => console.error('Error loading sidebar:', err));
}

function initializeContentSwitching() {
    // Remove old listeners to prevent duplicates
    document.removeEventListener('click', profileContentHandler);

    // Use event delegation on document level
    document.addEventListener('click', profileContentHandler);
}

function profileContentHandler(e) {
    const link = e.target.closest('.sidebar-link[data-page]');
    if (!link) return;

    e.preventDefault();

    const page = link.getAttribute('data-page');
    if (!page) return;

    // Update active state
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Load content
    loadContent(page);
}

function loadContent(page) {
    const contentContainer = document.getElementById('profileContent');
    if (!contentContainer) return;

    // Show loading state
    contentContainer.innerHTML = '<div class="content-loading"><div class="loading-spinner"></div><p>Loading...</p></div>';

    // Determine content URL
    let contentUrl;
    switch(page) {
        case 'overview':
            contentUrl = '/tyxar_web/profile/overview.html';
            break;
        case 'account':
            contentUrl = '/tyxar_web/profile/account.html';
            break;
        case 'settings':
            contentUrl = '/tyxar_web/profile/settings.html';
            break;
        case 'activity':
            contentUrl = '/tyxar_web/profile/activity.html';
            break;
        default:
            contentUrl = '/tyxar_web/profile/overview.html';
    }

    fetch(contentUrl)
        .then(response => {
            if (!response.ok) throw new Error('Page not found');
            return response.text();
        })
        .then(html => {
            contentContainer.style.opacity = '0';
            setTimeout(() => {
                contentContainer.innerHTML = html;
                contentContainer.style.opacity = '1';
                // Scroll to top
                contentContainer.scrollTop = 0;
            }, 150);
        })
        .catch(err => {
            contentContainer.innerHTML = `<div class="content-error"><h3>Error</h3><p>Could not load ${page} content.</p></div>`;
            console.error('Error loading content:', err);
        });
}

// Make functions available globally
window.initializeProfileDashboard = initializeProfileDashboard;
window.loadSidebar = loadSidebar;
window.loadContent = loadContent;