async function download(button) {
    const channelId = button.id;
    try {
        const res = await fetch(`/download/${channelId}/link`);

        if (!res.ok) {
            const errorText = await res.text();
            alert("Download failed: " + errorText);
            return;
        }

        const url = await res.text();
        window.location.href = url;
    } catch (err) {
        console.error("Download error:", err);
        alert("An error occurred while trying to get the download link.");
    }
}

function toggleInfo(element, userId) {
    const panel = element.parentElement.querySelector('.macro-info-panel');
    const isAlreadyOpen = panel.style.display === 'flex';

    document.querySelectorAll('.macro-info-panel').forEach(p => {
        p.style.display = 'none';
    });

    if (!isAlreadyOpen) {
        panel.style.display = 'flex';

        const usernameText = panel.querySelector(".macroUploaderName");
        const avatarImage = panel.querySelector(".macroUploaderAvatar");

        if (usernameText.innerText === "") {
            fetch(`/api/users/${userId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        usernameText.innerText = '@' + (data.user.globalName || data.user.username);
                        usernameText.style.display = "inline";
                        avatarImage.src = data.user.displayAvatarURL;
                    }
                })
                .catch(err => console.log("User fetch error:", err));
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    let allMacros = [];
    let serverId = "";
    let renderLoopId = 0;

    fetch('/api/config')
        .then(res => res.json())
        .then(data => {
            serverId = data.serverId;
        });

    function escapeHTML(str) {
        if (!str) return "";
        const p = document.createElement('p');
        p.textContent = str;
        return p.innerHTML;
    }

    fetch('/api/fileTypes')
        .then(res => res.json())
        .then(data => {
            const fileTypeFilter = document.getElementById("fileTypeFilter");
            Object.keys(data).forEach(type => {
                const option = document.createElement("option");
                option.value = type;
                option.textContent = `.${type}`;
                fileTypeFilter.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading file types:", error));

    async function loadMacros() {
        try {
            const res = await fetch('/api/macros');
            const data = await res.json();
            allMacros = data.macros;
            filterAndRender();
        } catch (err) {
            console.log("Failed to load macros:", err);
        }
    }

    function renderMacros(list) {
        const grid = document.getElementById("macro-grid");
        grid.innerHTML = "";

        renderLoopId++;
        const currentId = renderLoopId;

        let currentIndex = 0;
        const chunkSize = 30;

        function renderChunk() {
            if (currentId !== renderLoopId) return;

            const endIndex = Math.min(currentIndex + chunkSize, list.length);
            let htmlChunk = "";

            for (let i = currentIndex; i < endIndex; i++) {
                const macro = list[i];

                htmlChunk += `
                <div class="macro-card" data-type="${macro.type}" data-noclip="${macro.noclip}" style="position: relative;">
                    <div class="info-trigger" onclick="toggleInfo(this, '${macro.userId}')" data-tooltip="Macro Details">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                        </svg>
                    </div>

                    <div class="macro-info-panel" style="display: none;">
                        <div class="panel-content">
                            <h3>Macro Details</h3>
            
                            <p style="display: flex; align-items: center; justify-content: center; gap: 8px; margin: 10px 0;">
                                <strong>Uploader:</strong>
                                <span class="macroUploaderName username"></span> 
                                <img class="macroUploaderAvatar avatar" src="https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: block;">
                            </p>
                            <p id="threadId"><strong>Thread: </strong><a style="color: #5865F2; font-weight: bold; text-decoration: none;" target="_blank" rel="noopener noreferrer" href="https://discord.com/channels/${serverId}/${macro.channelId}">View on Discord</a></p>

                            <button onclick="this.closest('.macro-info-panel').style.display='none'"">Close</button>
                        </div>
                    </div>

                    <div class="macro-header">
                        <h2>${escapeHTML(macro.name)}</h2>
                        <span class="author">by ${escapeHTML(macro.author)}</span>
                    </div>

                    <div class="macro-info">
                        <p><strong>Noclip:</strong> ${macro.noclip}</p>
                        <p><strong>ID:</strong> ${macro.levelId}</p>
                        <p><strong>Type:</strong> ${macro.type}</p>
                    </div>

                    <div class="macro-notes">
                        ${escapeHTML(macro.notes) || ""}
                    </div>

                    <button class="download-btn" id="${macro.channelId}" onclick="download(this)">Download</button>
                </div>
                `;
            }

            grid.insertAdjacentHTML('beforeend', htmlChunk);
            currentIndex = endIndex;

            if (currentIndex < list.length) {
                requestAnimationFrame(renderChunk);
            }
        }

        renderChunk();
    }

    const searchInput = document.getElementById("searchInput");
    const fileTypeFilter = document.getElementById("fileTypeFilter");
    const noclipFilter = document.getElementById("noclipFilter");

    function filterAndRender() {
        const searchValue = searchInput.value.toLowerCase();
        const typeValue = fileTypeFilter.value;
        const noclipValue = noclipFilter.value;

        const filteredList = allMacros.filter(macro => {
            const name = (macro.name || "").toLowerCase();
            const author = (macro.author || "").toLowerCase();
            const levelId = (macro.levelId || "").toString().toLowerCase();
            const type = macro.type;
            const noclip = macro.noclip;

            const matchesSearch = name.includes(searchValue) || author.includes(searchValue) || levelId.includes(searchValue);
            const matchesType = typeValue === "" || type === typeValue;
            const matchesNoclip = noclipValue === "" || noclip === noclipValue;

            return matchesSearch && matchesType && matchesNoclip;
        });

        renderMacros(filteredList);
    }

    searchInput.addEventListener("input", filterAndRender);
    fileTypeFilter.addEventListener("change", filterAndRender);
    noclipFilter.addEventListener("change", filterAndRender);

    loadMacros();
});