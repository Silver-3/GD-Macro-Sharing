window.addEventListener('DOMContentLoaded', () => {
    const signInText = document.getElementById("sign-in");
    const userWrapper = document.getElementById("settings-menu");
    const usernameText = document.getElementById("username");
    const avatarImage = document.getElementById("avatar");
    
    const trigger = document.getElementById("user-trigger");
    const dropdown = document.getElementById("settings-dropdown");
    const logoutBtn = document.getElementById("logout-button");

    fetch('/api/me')
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                signInText.style.display = "none";
                userWrapper.style.display = "flex";
                usernameText.innerText = '@' + (data.user.globalName || data.user.username);
                avatarImage.src = data.user.displayAvatarURL;
            } else {
                signInText.style.display = "block";
                userWrapper.style.display = "none";
            }
        })
        .catch(() => {
            signInText.style.display = "block";
            userWrapper.style.display = "none";
        });

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        if (dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
        }
    });

    logoutBtn.addEventListener('click', () => {
        fetch('/api/logout')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                }
            })  
            .catch(err => console.error("Logout failed", err));
    });
});