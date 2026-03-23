// Sidebar toggle logic for mobile
document.addEventListener('DOMContentLoaded', function () {
	const sidebar = document.getElementById('sidebar');
	const openBtn = document.getElementById('openSidebar');
	const closeBtn = document.getElementById('closeSidebar');

	function openSidebar() {
		sidebar.classList.add('open');
		document.body.style.overflow = 'hidden'; // Prevent background scroll
	}
	function closeSidebar() {
		sidebar.classList.remove('open');
		document.body.style.overflow = '';
	}

	// Only enable toggle on mobile
	function isMobile() {
		return window.innerWidth <= 700;
	}

	if (openBtn && closeBtn && sidebar) {
		openBtn.addEventListener('click', function () {
			if (isMobile()) openSidebar();
		});
		closeBtn.addEventListener('click', function () {
			if (isMobile()) closeSidebar();
		});
	}

	// Hide sidebar if resizing to desktop
	window.addEventListener('resize', function () {
		if (!isMobile()) {
			sidebar.classList.remove('open');
			document.body.style.overflow = '';
		}
	});

	// Optional: Close sidebar when clicking outside (mobile only)
	document.addEventListener('click', function (e) {
		if (isMobile() && sidebar.classList.contains('open')) {
			if (!sidebar.contains(e.target) && !openBtn.contains(e.target)) {
				closeSidebar();
			}
		}
	});

	// Dynamic time display
	function updateTime() {
		const timeDiv = document.getElementById('dashboardTime');
		if (!timeDiv) return;
		const now = new Date();
		const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
		timeDiv.textContent = now.toLocaleString(undefined, options);
	}
	updateTime();
	setInterval(updateTime, 60000);
});
