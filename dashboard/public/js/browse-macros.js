async function download(button) {
    const channelId = button.id;
    const res = await fetch(`/download/${channelId}/link`);

    if (!res.ok) {
        const errorText = await res.text();
        alert(errorText);
        return;
    }

    const url = await res.text();
    window.location.href = url;
}

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
            .catch(console.error)
    }

    async function loadMacros() {
        try {
            const res = await fetch('/api/macros');
            const data = await res.json();
            const macros = data.macros;

            renderMacros(macros);
        } catch (err) {
            console.error("Failed to load macros:", err);
        }
    }

    function renderMacros(list) {
        const grid = document.getElementById("macro-grid");
        grid.innerHTML = "";
        let currentIndex = 0;

        function renderChunk() {
            const endIndex = Math.min(currentIndex + 20, list.length);
            let htmlChunk = "";
            
            for (let i = currentIndex; i < endIndex; i++) {
                const macro = list[i];
                htmlChunk += `
                <div class="macro-card" data-type="${macro.type}" data-noclip="${macro.noclip}">
                    <div class="macro-header">
                        <h2>${macro.name}</h2>
                        <span class="author">by ${macro.author}</span>
                    </div>

                    <div class="macro-info">
                        <p><strong>Noclip:</strong> ${macro.noclip}</p>
                        <p><strong>ID:</strong> ${macro.levelId}</p>
                        <p><strong>Type:</strong> ${macro.type}</p>
                    </div>

                    <div class="macro-notes">
                        ${macro.notes}
                    </div>

                    <button class="download-btn" id=${macro.channelId} onclick="download(this)">Download</button>
                </div>
                `;
            }

            grid.innerHTML += htmlChunk;
            currentIndex = endIndex;
            if (currentIndex < list.length) {
                setTimeout(renderChunk, 0); 
            }
        }

        renderChunk();
    }

    loadMacros();

    const searchInput = document.getElementById("searchInput");

    function search() {
        const searchValue = searchInput.value.toLowerCase();
        const cards = document.querySelectorAll(".macro-card");

        cards.forEach(card => {
            const name = card.querySelector("h2").textContent.toLowerCase();
            const author = card.querySelector(".author").textContent.toLowerCase();

            if (name.includes(searchValue) || author.includes(searchValue)) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    };

    const fileTypeFilter = document.getElementById("fileTypeFilter");
    const noclipFilter = document.getElementById("noclipFilter");


    function filters() {
        const searchValue = searchInput.value.toLowerCase();
        const typeValue = fileTypeFilter.value;
        const noclipValue = noclipFilter.value;

        const cards = document.querySelectorAll(".macro-card");

        cards.forEach(card => {
            const name = card.querySelector("h2").textContent.toLowerCase();
            const author = card.querySelector(".author").textContent.toLowerCase();
            const type = card.getAttribute("data-type");
            const noclip = card.getAttribute("data-noclip");

            const matchesSearch =
                name.includes(searchValue) ||
                author.includes(searchValue);

            const matchesType = typeValue == "" || type == typeValue;
            const matchesNoclip = noclipValue == "" || (noclipValue == "yes" && noclip == "yes") || (noclipValue == "no" && noclip == "no");

            if (matchesSearch && matchesType && matchesNoclip) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
    }

    searchInput.addEventListener("input", search);
    searchInput.addEventListener("input", filters);

    fileTypeFilter.addEventListener("change", filters);
    noclipFilter.addEventListener("change", filters);
}