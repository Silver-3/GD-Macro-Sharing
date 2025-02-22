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

    const login = document.getElementById("login");

    login.addEventListener("click", () => {
      window.location.href = "https://discord.com/oauth2/authorize?client_id=1321386347910533171&response_type=token&redirect_uri=http%3A%2F%2F175.33.246.73%3A3000%2Fauth&scope=identify";
    });

    const userId = getCookie("userId");
    if (userId) window.location.href = '/submit-macro';
}