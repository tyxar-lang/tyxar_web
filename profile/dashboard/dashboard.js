
// Sidebar open/close for mobile
document.addEventListener('DOMContentLoaded', function () {
	const sidebar = document.getElementById('sidebar');
	const hamburger = document.getElementById('hamburgerBtn');
	const closeBtn = document.getElementById('sidebarCloseBtn');

	function openSidebar() {
		sidebar.classList.add('open');
	}
	function closeSidebar() {
		sidebar.classList.remove('open');
	}

	if (hamburger && sidebar && closeBtn) {
		hamburger.addEventListener('click', openSidebar);
		closeBtn.addEventListener('click', closeSidebar);

		// Close sidebar when clicking outside (mobile only)
		document.addEventListener('click', function (e) {
			if (window.innerWidth <= 700 && sidebar.classList.contains('open')) {
				if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
					closeSidebar();
				}
			}
		});
	}
});

// Dashboard time display
function updateDashboardTime() {
	const el = document.getElementById('dashboardTime');
	if (!el) return;
	const now = new Date();
	const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
	el.textContent = now.toLocaleDateString(undefined, options);
}
setInterval(updateDashboardTime, 1000);
document.addEventListener('DOMContentLoaded', updateDashboardTime);
