window.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById("loginButton");
    const returnButton = document.getElementById("returnButton");

    loginButton.addEventListener("click", () => {
      const returnUrl = encodeURIComponent(window.location.pathname);
      window.location.href = `/sign-in?returnUrl=${returnUrl}`;
    });

    returnButton.addEventListener("click", () => {
      window.location.href = "/";
    });
});