document.addEventListener('DOMContentLoaded', () => {
    const docsContainer = document.querySelector('.docs');
    const contentArea = document.querySelector('.content');

    if (!docsContainer || !contentArea) return;

    // Create sidebar if missing
    let sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
        sidebar = document.createElement('div');
        sidebar.className = 'sidebar';
        docsContainer.insertBefore(sidebar, contentArea);
    }

    fetch('/tyxar_web/docs/sidebar.html')
        .then(r => { if (!r.ok) throw Error(r.status); return r.text(); })
        .then(html => {
            sidebar.innerHTML = html;

            // Only run on mobile/tablet 1023px and below
            if (window.innerWidth > 768) return;

            // Floating toggle button
            const btn = document.createElement('button');
            btn.innerHTML = 'Menu';
            btn.setAttribute('aria-label', 'Toggle navigation');
            Object.assign(btn.style, {
                position: 'fixed',
                left: '16px',
                width: '56px',
                height: '56px',
                background: 'white',
                color: 'var(--metal-dark)',
                border: 'none',
                borderRadius: '12px',
                fontSize: '28px',
                fontWeight: 'bold',
                cursor: 'pointer',
                zIndex: '1001',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease',
            });
            document.body.appendChild(btn);

            const MIN_TOP = 160;   // Starting position when page is at top
            const STICKY_TOP = 10;   // Final sticky position when scrolled
            const OPEN_TOP = 10;   // Force to 10px when sidebar is open

            let isOpen = false;

            const updateButton = () => {
                isOpen = sidebar.classList.contains('open');
                btn.innerHTML = isOpen ? '×' : '☰';
                btn.style.background = isOpen ? 'var(--accent-blue)' : 'white';
                btn.style.color = isOpen ? 'white' : 'var(--metal-dark)';

                // When sidebar is open → force button to 10px immediately
                if (isOpen) {
                    btn.style.top = `${OPEN_TOP}px`;
                } else {
                    // Normal smart sticky behavior
                    const scrolled = window.scrollY;
                    let top = MIN_TOP - scrolled;
                    top = Math.max(STICKY_TOP, Math.min(MIN_TOP, top));
                    btn.style.top = `${top}px`;
                }
            };

            // Toggle sidebar
            btn.onclick = e => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
                updateButton();
            };

            // Close when clicking outside
            document.addEventListener('click', e => {
                if (isOpen && !sidebar.contains(e.target) && !btn.contains(e.target)) {
                    sidebar.classList.remove('open');
                    updateButton();
                }
            });

            // Close with Escape
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && isOpen) {
                    sidebar.classList.remove('open');
                    updateButton();
                }
            });

            // Scroll handler — only affects position when sidebar is closed
            const handleScroll = () => {
                if (!isOpen) updateButton();
            };

            window.addEventListener('scroll', handleScroll);

            // Initial setup
            updateButton();
            handleScroll();
        })
        .catch(err => {
            console.error('Sidebar failed:', err);
            sidebar.innerHTML = '<p style="color:red;padding:20px;">Sidebar failed to load</p>';
        });
});

// Function to add copy buttons to code blocks
function addCopyButtons() {
    const preElements = document.querySelectorAll('.content-wrapper pre');

    preElements.forEach(pre => {
        // Skip if already wrapped
        if (pre.parentNode.classList.contains('pre-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'pre-wrapper';

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const copyBtn = document.createElement('button');
        copyBtn.className = 'copy-btn';
        copyBtn.textContent = '📋';
        copyBtn.setAttribute('aria-label', 'Copy code to clipboard');

        copyBtn.addEventListener('click', async () => {
            const code = pre.querySelector('code');
            const textToCopy = code ? code.textContent : pre.textContent;

            try {
                await navigator.clipboard.writeText(textToCopy.trim());
                copyBtn.textContent = '✅';
                copyBtn.style.background = '#28a745';

                setTimeout(() => {
                    copyBtn.textContent = '📋';
                    copyBtn.style.background = '#398fff';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                copyBtn.textContent = '❌';
                copyBtn.style.background = '#dc3545';

                setTimeout(() => {
                    copyBtn.textContent = '📋';
                    copyBtn.style.background = '#398fff';
                }, 2000);
            }
        });

        wrapper.appendChild(copyBtn);
    });

    // Set up mutation observer to watch for new content
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper && !contentWrapper._copyObserver) {
        const observer = new MutationObserver(() => {
            addCopyButtons();
        });
        observer.observe(contentWrapper, { childList: true, subtree: true });
        contentWrapper._copyObserver = observer;
    }
}

// Add copy buttons after content is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for content to load
    setTimeout(addCopyButtons, 500);
});
// Load footer and sidebar
// Load footer and sidebar
fetch('/tyxar_web/footer.html')
    .then(response => response.text())
    .then(data => {
        const f = document.getElementById('footer'); if (f) f.innerHTML = data;
    })
    .catch(err => console.error('Error loading footer:', err));

fetch('/tyxar_web/header.html')
    .then(response => response.text())
    .then(data => {
        const f = document.getElementById('header'); if (f) f.innerHTML = data;
    })
    .catch(err => console.error('Error loading footer:', err));

fetch('/tyxar_web/docs/sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar').innerHTML = data;
        // Initialize content loader after sidebar is loaded
        setTimeout(() => {
            initializeContentLoader();
            // Add copy buttons after content is loaded
            setTimeout(addCopyButtons, 200);
        }, 100);
    })
    .catch(err => {
        console.error('Error loading sidebar:', err);
    });