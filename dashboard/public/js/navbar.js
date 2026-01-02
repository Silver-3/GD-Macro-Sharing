window.addEventListener('DOMContentLoaded', () => {
    const signInText = document.getElementById("sign-in");
    const usernameText = document.getElementById("username");
    const avatarImage = document.getElementById("avatar");

    fetch('/api/me')
        .then(res => res.json())
        .then(data => {
            if (data.user) {
                if (signInText) signInText.style.display = "none";
                
                usernameText.innerText = '@' + (data.user.globalName || data.user.username);
                usernameText.style.display = "block";
                
                if (data.user.displayAvatarURL) {
                    avatarImage.src = data.user.displayAvatarURL;
                }
            } else {
                if (signInText) signInText.style.display = "block";
                usernameText.style.display = "none";
            }
        })
        .catch(err => console.log("Not logged in"));
});