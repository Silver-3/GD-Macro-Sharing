window.onload = () => {
  const levelIdInput = document.getElementById("id");
  const nameInput = document.getElementById("name");
  const authorInput = document.getElementById("author");

  const nextButton = document.getElementById("nextButton");
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");

  const fileInput = document.getElementById("macroFile");
  const fileTypeText = document.getElementById("fileType");
  const submitButton = document.getElementById("submitButton");
  const uploadButton = document.getElementById("uploadButton");

  let expectedFileTypes = [];

  fetch('/api/fileTypes')
    .then(res => res.json())
    .then(data => {
      expectedFileTypes = Object.values(data).flat();

      if (fileInput) {
        const acceptString = expectedFileTypes.map(type => '.' + type).join(', ');
        fileInput.setAttribute('accept', acceptString);
      }
    })
    .catch(error => {
      console.log(error);
    });

  function checkFile() {
    if (fileInput.files.length > 0) {
      const fileName = fileInput.files[0].name;
      let fileType = fileName.split('.').pop();
      
      uploadButton.textContent = fileName;

      if (fileName.endsWith('.gdr.json') || /\.gdr(\s*\(\d+\))?\.json$/.test(fileName)) {
        fileType = 'gdr.json';
      }

      if (expectedFileTypes.length > 0 && !expectedFileTypes.includes(fileType)) {
        fileTypeText.textContent = `Invalid file type: .${fileType}`;
        fileTypeText.style.color = "red";
        submitButton.disabled = true;
      } else {
        fileTypeText.textContent = "";
        submitButton.disabled = false;
      }

    } else {
      if (typeof fileInfoText !== 'undefined') fileInfoText.textContent = "No file chosen";
      fileTypeText.textContent = "";
      submitButton.disabled = true;
    }
  }

  if (fileInput) fileInput.addEventListener("change", checkFile);

  if (uploadButton) {
    uploadButton.addEventListener('click', () => {
      fileInput.click();
    });
  }

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
    });
  } else {
    fetch(`/api/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        const user = data.user;

        document.getElementById("username").innerText = '@' + (user?.globalName ? user.globalName : user.username);
        document.getElementById("avatar").src = user.displayAvatarURL;
      })
      .catch(error => console.log(error))
  }

  function searchLevel() {
    const levelId = levelIdInput.value.trim();
    if (!/^\d+$/.test(levelId)) return;

    fetch(`/api/level/${levelId}`)
      .then(res => res.json())
      .then(data => {
        nameInput.value = data.name || "Not found";
        authorInput.value = data.author || "Unknown";

        if (data.name && data.author && nameInput.value !== "Not Found" && authorInput !== "Unknown") {
          nextButton.disabled = false;
        } else {
          nextButton.disabled = true;
        }
      })
      .catch(error => {
        console.log(error);
        nextButton.disabled = true;
      });
  }

  levelIdInput.addEventListener("input", searchLevel);

  nextButton.addEventListener("click", () => {
    step1.style.display = "none";
    step2.style.display = "block";
  });

  const toggleButtons = document.querySelectorAll('.noclip-button');
  const hiddenNoclipInput = document.getElementById('noclip');

  toggleButtons.forEach(button => {
    button.addEventListener('click', function () {
      toggleButtons.forEach(button => {
        button.classList.remove('selected');
      });

      this.classList.add('selected');

      const selectedValue = this.getAttribute('data-value');
      hiddenNoclipInput.value = selectedValue;
    });
  });

  const macroForm = document.getElementById("macroForm");

  macroForm.addEventListener("sumbit", () => {
    submitButton.disabled = true;
  });
}