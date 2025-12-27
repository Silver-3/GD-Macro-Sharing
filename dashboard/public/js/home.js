window.onload = () => {
    function getCookie(name) {
        let decodedCookie = decodeURIComponent(document.cookie);
        let cookies = decodedCookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(name + "=") === 0) {
                return cookie.substring(name.length + 1);
            }
        }
        return "";
    }

    const signInText = document.getElementById("sign-in");
    const userId = getCookie("userId");

    if (userId) {
        signInText.style.display = "none";

        fetch(`/api/user/${userId}`)
        .then(res => res.json())
        .then(data => {
            const user = data.user;

            document.getElementById("username").innerText = '@' + (user?.globalName ? user.globalName : user.username);
            document.getElementById("username").style.display = "block";
            document.getElementById("avatar").src = user.displayAvatarURL;
        })
        .catch(error => console.log(error))
    }
}