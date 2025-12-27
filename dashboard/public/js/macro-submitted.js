window.onload = () => {
  const submitAnother = document.getElementById("submitAnother");

  submitAnother.addEventListener("click", () => {
    window.location.href = "/submit-macro";
  });

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

  const userId = getCookie("userId");

  if (!userId) {
    const modal = document.getElementById("loginModal");
    const loginButton = document.getElementById("loginButton");
    const returnButton = document.getElementById("returnButton");

    modal.style.display = "flex";

    document.getElementById("username").innerText = "Sign in";
    document.getElementById("avatar").src = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

    loginButton.addEventListener("click", () => {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/sign-in?returnUrl=${returnUrl}`;
    });

    returnButton.addEventListener("click", () => {
      window.location.href = "/";
    })
  } else {
    fetch(`/api/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        const user = data.user;

        document.getElementById("username").innerText = '@' + (user?.globalName ? user.globalName : user.username);
        document.getElementById("avatar").src = user.displayAvatarURL;
      })
      .catch(error => console.log(error))
  };
}