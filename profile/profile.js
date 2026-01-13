// Profile Dashboard JavaScript
// Consolidated from all dashboard pages

// Global variables for projects page
let currentFilter = 'all';
let currentSort = 'updated';
const sampleProjects = [
    {
        id: 1,
        name: 'Tyxar Web App',
        description: 'Main web application for Tyxar project management',
        type: 'web',
        visibility: 'private',
        status: 'active',
        lastUpdated: '2024-01-15',
        size: '2.4 MB',
        collaborators: 3,
        commits: 156,
        language: 'JavaScript',
        stars: 0,
        forks: 0
    },
    {
        id: 2,
        name: 'Tyxar Mobile',
        description: 'React Native mobile application',
        type: 'mobile',
        visibility: 'public',
        status: 'active',
        lastUpdated: '2024-01-12',
        size: '8.7 MB',
        collaborators: 2,
        commits: 89,
        language: 'JavaScript',
        stars: 12,
        forks: 3
    },
    {
        id: 3,
        name: 'Tyxar CLI',
        description: 'Command-line interface for Tyxar',
        type: 'desktop',
        visibility: 'public',
        status: 'archived',
        lastUpdated: '2023-12-20',
        size: '1.2 MB',
        collaborators: 1,
        commits: 45,
        language: 'Python',
        stars: 8,
        forks: 2
    },
    {
        id: 4,
        name: 'Tyxar API',
        description: 'REST API for Tyxar services',
        type: 'web',
        visibility: 'private',
        status: 'active',
        lastUpdated: '2024-01-10',
        size: '5.1 MB',
        collaborators: 4,
        commits: 203,
        language: 'Node.js',
        stars: 0,
        forks: 0
    }
];

// Initialize profile dashboard based on current page
function initializeProfileDashboard() {
    // Load header and footer
    loadHeader();
    loadFooter();

    // Initialize sidebar
    initializeSidebar();

    // Determine which page we're on and initialize accordingly
    const path = window.location.pathname;

    if (path.includes('/account/')) {
        initializeAccountPage();
    } else if (path.includes('/settings/')) {
        initializeSettingsPage();
    } else if (path.includes('/security/')) {
        initializeSecurityPage();
    } else if (path.includes('/projects/')) {
        initializeProjectsPage();
    }
}

// Account Page Functions
function initializeAccountPage() {
    loadUserData();
}

async function loadUserData() {
    try {
        const { data } = await supabaseClient.auth.getUser();
        const user = data.user;

        if (user) {
            document.getElementById('profileName').textContent =
                user.user_metadata?.full_name || user.user_metadata?.name || 'Not set';
            document.getElementById('profileEmail').textContent = user.email;
            document.getElementById('profileCreated').textContent =
                new Date(user.created_at).toLocaleDateString();

            // Fetch role
            const { data: profile } = await supabaseClient
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .single();

            document.getElementById('profileRole').textContent =
                profile?.is_admin ? "Administrator" : "User";
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

function editProfile() {
    alert('Edit profile functionality coming soon!');
}

function changePassword() {
    alert('Change password functionality coming soon!');
}

function exportData() {
    alert('Export data functionality coming soon!');
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        alert('Account deletion functionality coming soon!');
    }
}

function logout() {
    supabaseClient.auth.signOut().then(() => {
        window.location.href = '/tyxar_web/profile/';
    });
}

// Settings Page Functions
function initializeSettingsPage() {
    loadUserSettings();

    // Update toggle labels
    document.querySelectorAll('.toggle-switch input').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const label = this.parentElement.nextElementSibling;
            if (label) {
                label.textContent = this.checked ? 'Enabled' : 'Disabled';
            }
        });
    });
}

async function loadUserSettings() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        // Load user profile data
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            document.getElementById('display-name').value = profile.display_name || '';
            document.getElementById('email').value = user.email;
            document.getElementById('bio').value = profile.bio || '';
            document.getElementById('website').value = profile.website || '';

            // Load preferences (you might want to add a preferences table)
            // For now, using localStorage as fallback
            const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
            document.getElementById('theme').value = preferences.theme || 'auto';
            document.getElementById('language').value = preferences.language || 'en';
        }
    } catch (error) {
        console.error('Error loading user settings:', error);
    }
}

async function saveSettings() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const displayName = document.getElementById('display-name').value;
        const bio = document.getElementById('bio').value;
        const website = document.getElementById('website').value;
        const theme = document.getElementById('theme').value;
        const language = document.getElementById('language').value;

        // Update profile
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                display_name: displayName,
                bio: bio,
                website: website,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;

        // Save preferences to localStorage (you might want to add a preferences table)
        const preferences = { theme, language };
        localStorage.setItem('userPreferences', JSON.stringify(preferences));

        // Apply theme immediately
        applyTheme(theme);

        showNotification('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings. Please try again.', 'error');
    }
}

function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
        document.getElementById('display-name').value = '';
        document.getElementById('bio').value = '';
        document.getElementById('website').value = '';
        document.getElementById('theme').value = 'auto';
        document.getElementById('language').value = 'en';

        // Reset toggles
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.checked = toggle.id === 'profile-visibility' || toggle.id === 'activity-status' ||
                toggle.id === 'email-notifications' || toggle.id === 'project-updates' ||
                toggle.id === 'security-alerts';
        });

        showNotification('Settings reset to defaults.', 'info');
    }
}

function applyTheme(theme) {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');

    if (theme === 'light') {
        body.classList.add('light-theme');
    } else if (theme === 'dark') {
        body.classList.add('dark-theme');
    }
    // Auto theme is handled by CSS media queries
}

// Security Page Functions
function initializeSecurityPage() {
    loadSecurityInfo();
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

async function savePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }

    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        showNotification('Password changed successfully!', 'success');
        closeModal('password-modal');
        document.getElementById('password-form').reset();
        document.getElementById('password-last-changed').textContent = 'Just now';
    } catch (error) {
        console.error('Error changing password:', error);
        showNotification('Error changing password. Please try again.', 'error');
    }
}

async function verify2FA() {
    const code = document.getElementById('2fa-input').value;
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
        showNotification('Please enter a valid 6-digit code.', 'error');
        return;
    }

    // Here you would typically verify the 2FA code with your backend
    // For now, we'll just simulate enabling 2FA
    showNotification('Two-factor authentication enabled successfully!', 'success');
    closeModal('2fa-modal');
    document.getElementById('2fa-input').value = '';

    // Update UI
    const statusBadge = document.querySelector('#enable-2fa').previousElementSibling;
    statusBadge.className = 'status-badge status-active';
    statusBadge.textContent = 'Active';
    document.getElementById('enable-2fa').style.display = 'none';
}

async function connectGoogle() {
    try {
        const { error } = await supabase.auth.linkIdentity({
            provider: 'google'
        });

        if (error) throw error;

        showNotification('Google account connected successfully!', 'success');
    } catch (error) {
        console.error('Error connecting Google account:', error);
        showNotification('Error connecting Google account. Please try again.', 'error');
    }
}

function revokeSession(button) {
    if (confirm('Are you sure you want to revoke this session?')) {
        button.closest('.session-item').remove();
        showNotification('Session revoked successfully.', 'success');
    }
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
            // Here you would typically call a delete account API
            showNotification('Account deletion initiated. You will receive a confirmation email.', 'info');
        }
    }
}

async function loadSecurityInfo() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        // Load user metadata
        const metadata = user.user_metadata || {};
        document.getElementById('password-last-changed').textContent =
            metadata.password_last_changed || 'Never';

        // Get current location (simplified)
        document.getElementById('current-location').textContent = 'Current Location';

        // Get session start time
        const sessionStart = new Date(user.last_sign_in_at || user.created_at);
        document.getElementById('session-start').textContent = sessionStart.toLocaleString();

    } catch (error) {
        console.error('Error loading security info:', error);
    }
}

// Projects Page Functions
function initializeProjectsPage() {
    renderProjects();

    // Create project button
    const createProjectBtn = document.getElementById('create-project');
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', () => {
            openModal('create-project-modal');
        });
    }

    // Submit create project form
    const submitCreateProjectBtn = document.getElementById('submit-create-project');
    if (submitCreateProjectBtn) {
        submitCreateProjectBtn.addEventListener('click', createProject);
    }

    // Filter projects
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', function () {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProjects();
        });
    });

    // Search projects
    const searchInput = document.getElementById('project-search');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderProjects();
        });
    }

    // Sort projects
    const sortSelect = document.getElementById('sort-projects');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            currentSort = this.value;
            renderProjects();
        });
    }

    // Close menus when clicking outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.project-actions')) {
            document.querySelectorAll('.project-menu').forEach(m => m.style.display = 'none');
        }
    });
}

async function createProject() {
    const name = document.getElementById('project-name').value;
    const description = document.getElementById('project-description').value;
    const type = document.getElementById('project-type').value;
    const visibility = document.getElementById('project-visibility').value;
    const initializeRepo = document.getElementById('initialize-repo').checked;

    if (!name.trim()) {
        showNotification('Project name is required.', 'error');
        return;
    }

    try {
        // In a real app, you would create the project via API
        const newProject = {
            id: Date.now(),
            name: name,
            description: description,
            type: type,
            visibility: visibility,
            status: 'active',
            lastUpdated: new Date().toISOString().split('T')[0],
            size: '0 MB',
            collaborators: 1,
            commits: initializeRepo ? 1 : 0,
            language: getLanguageForType(type),
            stars: 0,
            forks: 0
        };

        sampleProjects.unshift(newProject);
        renderProjects();
        updateStats();

        showNotification('Project created successfully!', 'success');
        closeModal('create-project-modal');
        document.getElementById('create-project-form').reset();
    } catch (error) {
        console.error('Error creating project:', error);
        showNotification('Error creating project. Please try again.', 'error');
    }
}

function getLanguageForType(type) {
    const typeMap = {
        'web': 'JavaScript',
        'mobile': 'JavaScript',
        'desktop': 'Python',
        'library': 'JavaScript',
        'game': 'JavaScript',
        'other': 'Unknown'
    };
    return typeMap[type] || 'Unknown';
}

function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const searchTerm = document.getElementById('project-search')?.value.toLowerCase() || '';

    let filteredProjects = sampleProjects.filter(project => {
        const matchesFilter = currentFilter === 'all' ||
            (currentFilter === 'active' && project.status === 'active') ||
            (currentFilter === 'archived' && project.status === 'archived') ||
            (currentFilter === 'shared' && project.collaborators > 1);

        const matchesSearch = project.name.toLowerCase().includes(searchTerm) ||
            project.description.toLowerCase().includes(searchTerm);

        return matchesFilter && matchesSearch;
    });

    // Sort projects
    filteredProjects.sort((a, b) => {
        switch (currentSort) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'created':
                return new Date(b.id) - new Date(a.id); // Using ID as proxy for creation date
            case 'size':
                return parseFloat(b.size) - parseFloat(a.size);
            case 'updated':
            default:
                return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        }
    });

    grid.innerHTML = filteredProjects.map(project => `
        <div class="project-card" data-project-id="${project.id}">
            <div class="project-header">
                <div class="project-icon">${getProjectIcon(project.type)}</div>
                <div class="project-actions">
                    <button class="btn-icon" onclick="toggleProjectMenu(${project.id})">⋯</button>
                    <div class="project-menu" id="menu-${project.id}" style="display: none;">
                        <button onclick="viewProjectDetails(${project.id})">View Details</button>
                        <button onclick="editProject(${project.id})">Edit</button>
                        <button onclick="duplicateProject(${project.id})">Duplicate</button>
                        <button onclick="archiveProject(${project.id})" class="danger">Archive</button>
                    </div>
                </div>
            </div>
            <div class="project-content">
                <h3 class="project-title">${project.name}</h3>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    <span class="project-language">${project.language}</span>
                    <span class="project-updated">Updated ${formatDate(project.lastUpdated)}</span>
                </div>
            </div>
            <div class="project-footer">
                <div class="project-stats">
                    <span title="Collaborators">👥 ${project.collaborators}</span>
                    <span title="Commits">📝 ${project.commits}</span>
                    ${project.visibility === 'public' ? `<span title="Stars">⭐ ${project.stars}</span>` : ''}
                    ${project.visibility === 'public' ? `<span title="Forks">🍴 ${project.forks}</span>` : ''}
                </div>
                <div class="project-size">${project.size}</div>
            </div>
        </div>
    `).join('');

    updateStats();
}

function getProjectIcon(type) {
    const iconMap = {
        'web': '🌐',
        'mobile': '📱',
        'desktop': '💻',
        'library': '📚',
        'game': '🎮',
        'other': '📁'
    };
    return iconMap[type] || '📁';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
}

function toggleProjectMenu(projectId) {
    const menu = document.getElementById(`menu-${projectId}`);
    const isVisible = menu.style.display === 'block';
    document.querySelectorAll('.project-menu').forEach(m => m.style.display = 'none');
    menu.style.display = isVisible ? 'none' : 'block';
}

function viewProjectDetails(projectId) {
    const project = sampleProjects.find(p => p.id === projectId);
    if (!project) return;

    const content = document.getElementById('project-details-content');
    content.innerHTML = `
        <div class="project-details">
            <div class="project-details-header">
                <div class="project-icon-large">${getProjectIcon(project.type)}</div>
                <div>
                    <h2>${project.name}</h2>
                    <p>${project.description}</p>
                    <div class="project-badges">
                        <span class="badge badge-${project.status}">${project.status}</span>
                        <span class="badge badge-${project.visibility}">${project.visibility}</span>
                        <span class="badge">${project.language}</span>
                    </div>
                </div>
            </div>

            <div class="project-details-stats">
                <div class="stat-item">
                    <span class="stat-value">${project.size}</span>
                    <span class="stat-label">Size</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${project.commits}</span>
                    <span class="stat-label">Commits</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${project.collaborators}</span>
                    <span class="stat-label">Collaborators</span>
                </div>
                ${project.visibility === 'public' ? `
                <div class="stat-item">
                    <span class="stat-value">${project.stars}</span>
                    <span class="stat-label">Stars</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${project.forks}</span>
                    <span class="stat-label">Forks</span>
                </div>
                ` : ''}
            </div>

            <div class="project-details-info">
                <div class="info-section">
                    <h4>Last Updated</h4>
                    <p>${new Date(project.lastUpdated).toLocaleDateString()}</p>
                </div>
                <div class="info-section">
                    <h4>Project Type</h4>
                    <p>${project.type.charAt(0).toUpperCase() + project.type.slice(1)} Application</p>
                </div>
            </div>

            <div class="project-details-actions">
                <button class="btn-primary">Open Project</button>
                <button class="btn-secondary">Edit Settings</button>
                <button class="btn-outline">Share Project</button>
            </div>
        </div>
    `;

    openModal('project-details-modal');
}

function editProject(projectId) {
    showNotification('Edit project functionality coming soon!', 'info');
}

function duplicateProject(projectId) {
    showNotification('Duplicate project functionality coming soon!', 'info');
}

function archiveProject(projectId) {
    if (confirm('Are you sure you want to archive this project?')) {
        const project = sampleProjects.find(p => p.id === projectId);
        if (project) {
            project.status = 'archived';
            renderProjects();
            showNotification('Project archived successfully.', 'success');
        }
    }
}

function updateStats() {
    const totalEl = document.getElementById('total-projects');
    const activeEl = document.getElementById('active-projects');
    const sharedEl = document.getElementById('shared-projects');
    const sizeEl = document.getElementById('total-size');

    if (totalEl && activeEl && sharedEl && sizeEl) {
        const total = sampleProjects.length;
        const active = sampleProjects.filter(p => p.status === 'active').length;
        const shared = sampleProjects.filter(p => p.collaborators > 1).length;
        const totalSize = sampleProjects.reduce((sum, p) => sum + parseFloat(p.size), 0);

        totalEl.textContent = total;
        activeEl.textContent = active;
        sharedEl.textContent = shared;
        sizeEl.textContent = `${totalSize.toFixed(1)} MB`;
    }
}

// Initialize profile dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeProfileDashboard);