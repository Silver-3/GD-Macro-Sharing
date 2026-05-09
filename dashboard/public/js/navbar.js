window.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById("user-trigger");
    const dropdown = document.getElementById("settings-dropdown");
    const logoutBtn = document.getElementById("logout-button");

    if (trigger) {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        window.addEventListener('click', () => {
            dropdown.classList.remove('show');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            fetch('/api/logout')
                .then(res => res.json())
                .then(data => { if (data.success) window.location.reload(); })
                .catch(err => console.error("Logout failed", err));
        });
    }
});