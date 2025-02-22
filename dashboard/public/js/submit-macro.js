window.onload = () => {
    function checkFile() {
        const fileInput = document.getElementById("macroFile");
        const fileTypeText = document.getElementById("fileType");
        const submitButton = document.getElementById("submitButton");
  
        if (fileInput.files.length > 0) {
          const fileName = fileInput.files[0].name;
          let fileType = fileName.split('.').pop();
          const expectedFiletypes = ["gdr", "gdr.json", "re", "re2", "mhr", "xd"];
  
          if (fileName.endsWith('.gdr.json') || /\.gdr(\s*\(\d+\))?\.json$/.test(fileName)) {
            fileType = 'gdr.json';
          }
  
          if (!expectedFiletypes.includes(fileType)) {
            fileTypeText.textContent = `Invalid file type: .${fileType}`;
            fileTypeText.style.color = "red";
            submitButton.disabled = true;
          } else {
            fileTypeText.textContent = `Valid file type: .${fileType}`;
            fileTypeText.style.color = "green";
            submitButton.disabled = false;
          }
  
        } else {
          fileTypeText.textContent = "";
          submitButton.disabled = true;
        }
      }

    const fileInput = document.getElementById("macroFile");
    if (fileInput) fileInput.addEventListener("change", checkFile);
  
      function validateTemplate() {
        const name = document.getElementById("name").value.trim();
        const author = document.getElementById("author").value.trim();
        const id = document.getElementById("id").value.trim();
        const noclip = document.getElementById("noclip").checked ? "yes" : "no";
  
        const template = `${name} made by ${author} | noclip: ${noclip} | id: ${id}`;
        const templateLength = template.length + 1;
  
        const characterLimit = document.getElementById("characterLimit");
        const submitButton = document.getElementById("submitButton");
  
        if (templateLength > 100) {
          characterLimit.textContent = `Character limit: ${templateLength}/100`;
          characterLimit.style.color = "red";
          submitButton.disabled = true;
        } else {
          characterLimit.textContent = `Character limit: ${templateLength}/100`;
          characterLimit.style.color = "green";
          submitButton.disabled = false;
        }
      }
  
      document.getElementById("name").addEventListener("input", validateTemplate);
      document.getElementById("author").addEventListener("input", validateTemplate);
      document.getElementById("id").addEventListener("input", validateTemplate);
      document.getElementById("noclip").addEventListener("change", validateTemplate);

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

      fetch(`/api/user/${getCookie("userId")}`)
        .then(res => res.json())
        .then(data => {
            const user = data.user;

            document.getElementById("username").innerText = '@' + user.username;
            document.getElementById("avatar").src = user.displayAvatarURL;
        })
        .catch(console.error)
};