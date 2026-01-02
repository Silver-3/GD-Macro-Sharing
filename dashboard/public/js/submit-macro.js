window.addEventListener('DOMContentLoaded', () => {
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
});