function initializeContentLoader() {
    // Remove old listeners to prevent duplicates
    document.removeEventListener('click', contentLoaderHandler);

    // Use event delegation on document level — works everywhere, even dynamically added links
    document.addEventListener('click', contentLoaderHandler);

    console.log('Content loader initialized globally (works in sidebar, footer, header, anywhere)');
}

function contentLoaderHandler(e) {
    const link = e.target.closest('a[data-page]');
    if (!link) return;

    e.preventDefault();

    const pagePath = link.getAttribute('data-page');
    if (!pagePath) return;

    // Remove active class from all known sidebar links (optional visual polish)
    document.querySelectorAll('a[data-page]').forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Build correct path
    let fullPath = pagePath;
    if (!pagePath.startsWith('http') && !pagePath.startsWith('/') && !pagePath.includes('.html')) {
        fullPath = `docs/${pagePath}`;
    }

    const [path, hash] = fullPath.split('#');
    const url = hash ? `${path}#${hash}` : path;

    // Load content
    const content = document.getElementById('content');
    if (!content) {
        window.location.href = url; // fallback: normal navigation if not on docs page
        return;
    }

    content.innerHTML = '<div class="content-wrapper"><h1>Loading...</h1></div>';

    fetch(path.endsWith('.html') ? path : `${path}.html`)
        .then(r => {
            if (!r.ok) throw new Error(r.status);
            return r.text();
        })
        .then(html => {
            content.style.opacity = '0';
            setTimeout(() => {
                content.innerHTML = html;
                content.style.opacity = '1';
                if (hash) {
                    setTimeout(() => {
                        const el = document.getElementById(hash);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                } else {
                    content.scrollTop = 0;
                }
            }, 150);
        })
        .catch(err => {
            content.innerHTML = `<div class="content-wrapper"><h1>Error</h1><p>Page not found.</p></div>`;
            console.error(err);
        });
}

// Call it once on DOM ready — works everywhere now
document.addEventListener('DOMContentLoaded', initializeContentLoader);

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    const body = document.body;

    if (!menuToggle || !mainNav) {
        return; // Not on a page with mobile menu
    }

    // Check if already initialized
    if (menuToggle.dataset.initialized === 'true') {
        return;
    }

    // Mark as initialized
    menuToggle.dataset.initialized = 'true';

    // Create backdrop element if it doesn't exist
    let backdrop = document.querySelector('.mobile-menu-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'mobile-menu-backdrop';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.appendChild(backdrop);
    }

    // Toggle menu function
    function toggleMenu() {
        const isOpen = mainNav.classList.contains('active');

        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    // Open menu
    function openMenu() {
        mainNav.classList.add('active');
        backdrop.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        body.classList.add('menu-open');

        // Focus trap - focus first link when menu opens
        const firstLink = mainNav.querySelector('.nav-link');
        if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
        }
    }

    // Close menu
    function closeMenu() {
        mainNav.classList.remove('active');
        backdrop.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        body.classList.remove('menu-open');
    }

    // Event listeners (using named functions so we can remove them if needed)
    menuToggle.addEventListener('click', toggleMenu);
    backdrop.addEventListener('click', closeMenu);

    // Close menu when clicking on a link
    const navLinks = mainNav.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Small delay to allow navigation
            setTimeout(closeMenu, 100);
        });
    });

    // Close menu on Escape key (use once to avoid duplicates)
    const escapeHandler = (e) => {
        if (e.key === 'Escape' && mainNav.classList.contains('active')) {
            closeMenu();
            menuToggle.focus(); // Return focus to toggle button
        }
    };
    document.addEventListener('keydown', escapeHandler);

    // Handle window resize - close menu if window becomes large
    let resizeTimer;
    const resizeHandler = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && mainNav.classList.contains('active')) {
                closeMenu();
            }
        }, 250);
    };
    window.addEventListener('resize', resizeHandler);

    // Store handlers for cleanup if needed
    menuToggle._menuHandlers = { escapeHandler, resizeHandler };
}

/**
 * Initialize animations for homepage elements
 */
function initializeHomepageAnimations() {
    // Animate hero section on load
    const hero = document.querySelector('.hero-content');
    if (hero) {
        hero.style.opacity = '0';
        hero.style.transform = 'translateY(30px)';
        setTimeout(() => {
            hero.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            hero.style.opacity = '1';
            hero.style.transform = 'translateY(0)';
        }, 100);
    }

    // Animate code example
    const codeExample = document.querySelector('.code-example');
    if (codeExample) {
        codeExample.style.opacity = '0';
        codeExample.style.transform = 'translateY(30px)';
        setTimeout(() => {
            codeExample.style.transition = 'opacity 1s ease, transform 1s ease';
            codeExample.style.opacity = '1';
            codeExample.style.transform = 'translateY(0)';
        }, 400);
    }

    // Animate feature cards with stagger
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 600 + (index * 100));
    });

    // Animate use case items
    const caseItems = document.querySelectorAll('.case-item');
    caseItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        setTimeout(() => {
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
        }, 1000 + (index * 100));
    });

    // Add scroll animations for elements
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all animated elements
    document.querySelectorAll('.feature-card, .case-item').forEach(el => {
        observer.observe(el);
    });
}

// Function to initialize search bar functionality
function initializeSearchBar() {
    const searchBar = document.querySelector('.search-bar');
    const searchIcon = document.querySelector('.search-icon');
    const clearIcon = document.querySelector('.clear-icon');

    if (!searchBar || !searchIcon) {
        return; // Search bar elements not found
    }

    // Function to perform search
    function performSearch() {
        const query = searchBar.value.trim();
        if (query) {
            window.location.href = `search?q=${encodeURIComponent(query)}`;
        }
    }

    // Function to toggle clear button
    function toggleClearButton() {
        if (clearIcon) {
            clearIcon.style.display = searchBar.value.trim() ? 'flex' : 'none';
        }
    }

    // Function to clear search
    function clearSearch() {
        searchBar.value = '';
        toggleClearButton();
        searchBar.focus();
    }

    // Event listeners
    searchIcon.addEventListener('click', performSearch);
    searchBar.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    searchBar.addEventListener('input', toggleClearButton);
    if (clearIcon) {
        clearIcon.addEventListener('click', clearSearch);
    }

    // Initialize clear button visibility
    toggleClearButton();
}

/**
 * Initialize search functionality
 * Searches HTML content of all pages dynamically
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchForm = document.getElementById('searchForm');
    const searchResults = document.getElementById('searchResults');
    const searchClear = document.getElementById('searchClear');

    if (!searchInput || !searchForm || !searchResults) {
        return; // Search elements not found
    }

    // List of pages to search (can be expanded)
    const searchablePages = [
        { url: '/', title: 'Home' },
        { url: 'about', title: 'About' },
        { url: 'blade', title: 'BLADE' },
        { url: 'docs', title: 'Documentation' },
        { url: 'docs/cli', title: 'CLI' },
        { url: 'docs/blade', title: 'Development' },
        { url: 'docs/faq', title: 'FAQ' },
        { url: 'docs/get-started', title: 'Getting Started' },
        { url: 'docs/syntax', title: 'Syntax' },
        { url: 'download', title: 'Download' },
        { url: 'menu', title: 'Menu' },
        { url: 'releases', title: 'Releases' },
        { url: 'account', title: 'Sign In' },
    ];

    let searchTimeout;
    let currentSearchQuery = '';
    let searchCache = {}; // Cache fetched pages

    // Show/hide clear button
    function toggleClearButton() {
        if (searchClear) {
            searchClear.style.display = searchInput.value.trim() ? 'flex' : 'none';
        }
    }

    // Clear search
    if (searchClear) {
        searchClear.addEventListener('click', () => {
            searchInput.value = '';
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            toggleClearButton();
            searchInput.focus();
        });
    }

    // Extract text content from HTML
    function extractText(html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Remove script and style elements
        const scripts = tempDiv.querySelectorAll('script, style, nav, header, footer');
        scripts.forEach(el => el.remove());

        return tempDiv.textContent || tempDiv.innerText || '';
    }

    // Highlight search terms in text
    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    // Get snippet around match
    function getSnippet(text, query, maxLength = 150) {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index === -1) {
            return text.substring(0, maxLength) + '...';
        }

        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + query.length + 100);
        let snippet = text.substring(start, end);

        if (start > 0) snippet = '...' + snippet;
        if (end < text.length) snippet = snippet + '...';

        return highlightText(snippet, query);
    }

    // Search a single page
    async function searchPage(page, query) {
        try {
            // Check cache first
            if (searchCache[page.url]) {
                return searchInContent(searchCache[page.url], page, query);
            }

            // Fetch page
            const response = await fetch(page.url);
            if (!response.ok) return null;

            const html = await response.text();
            searchCache[page.url] = html; // Cache it

            return searchInContent(html, page, query);
        } catch (error) {
            console.error(`Error searching ${page.url}:`, error);
            return null;
        }
    }

    // Search in HTML content
    function searchInContent(html, page, query) {
        const text = extractText(html);
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();

        if (!lowerText.includes(lowerQuery)) {
            return null;
        }

        // Count matches for relevance
        const matches = (lowerText.match(new RegExp(lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;

        return {
            url: page.url,
            title: page.title,
            snippet: getSnippet(text, query),
            relevance: matches
        };
    }

    // Perform search
    async function performSearch(query) {
        if (!query || query.trim().length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        currentSearchQuery = query.trim();
        searchResults.style.display = 'block';
        searchResults.innerHTML = '<div class="search-loading">Searching</div>';

        try {
            // Search all pages in parallel
            const results = await Promise.all(
                searchablePages.map(page => searchPage(page, currentSearchQuery))
            );

            // Filter out null results and sort by relevance
            const validResults = results
                .filter(r => r !== null)
                .sort((a, b) => b.relevance - a.relevance)
                .slice(0, 10); // Limit to 10 results

            displayResults(validResults, currentSearchQuery);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="search-no-results">Error performing search. Please try again.</div>';
        }
    }

    // Display search results
    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">No results found for "' + query + '"</div>';
            return;
        }

        const resultsHTML = results.map(result => `
            <div class="search-result-item" data-url="${result.url}">
                <div class="search-result-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    ${highlightText(result.title, query)}
                </div>
                <div class="search-result-url">${result.url}</div>
                <div class="search-result-snippet">${result.snippet}</div>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHTML;

        // Add click handlers
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const url = item.dataset.url;
                window.location.href = url;
            });
        });
    }

    // Handle input
    searchInput.addEventListener('input', (e) => {
        toggleClearButton();
        clearTimeout(searchTimeout);

        const query = e.target.value.trim();
        if (query.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300); // Debounce search
    });

    // Handle form submission
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
            // Navigate to search results page with query
            window.location.href = `search?q=${encodeURIComponent(query)}`;
        }
    });

    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchForm.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Handle keyboard navigation
    let selectedIndex = -1;
    searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelection(items, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelection(items, selectedIndex);
        } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
            e.preventDefault();
            items[selectedIndex].click();
        } else if (e.key === 'Escape') {
            searchResults.style.display = 'none';
            selectedIndex = -1;
        }
    });

    function updateSelection(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('active', i === index);
        });
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

    // Initialize clear button visibility
    toggleClearButton();
}


// Make functions available globally
window.initializeContentLoader = initializeContentLoader;
window.initializeSearchBar = initializeSearchBar;
window.initializeSidebar = initializeSidebar;

/**
 * Initialize sidebar navigation for dashboard pages
 */
function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll('.nav-link[data-page]');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const page = this.getAttribute('data-page');
            if (!page) return;

            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');

            // Navigate to the page
            const pagePath = `profile/${page}/`;
            window.location.href = pagePath;
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize search
    initializeSearch();

    // Initialize mobile menu (will also be called after header loads)
    initializeMobileMenu();

    // Initialize homepage animations
    initializeHomepageAnimations();

    // Initialize content loading for documentation pages (will be called after sidebar loads)
    if (document.getElementById('content')) {
        // Try to initialize immediately, but it will retry after sidebar loads
        setTimeout(() => {
            initializeContentLoader();
        }, 500);
    }

    // Header-related dynamic observer removed (header is no longer injected).
    // Also try to initialize after a short delay
    setTimeout(() => {
        initializeMobileMenu();
        initializeSearch();
    }, 500);

    // Initialize scrolling quotes if present
    const scrollingQuotes = document.querySelector('.scrolling_quotes');
    if (scrollingQuotes) {
        const quotes = scrollingQuotes.innerHTML;
        scrollingQuotes.innerHTML = quotes + quotes;
    }

    // Initialize other features
    console.log('Tyxar website loaded successfully!');
});
