window.addEventListener('DOMContentLoaded', () => {
    let allMacros = [];
    let renderLoopId = 0;

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
        .catch(error => {
            console.log(error);
        });

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
            const name = macro.name.toLowerCase();
            const author = macro.author.toLowerCase();
            const levelId = (macro.levelId || "").toString().toLowerCase();
            const type = macro.type;
            const noclip = macro.noclip;

            const matchesSearch = name.includes(searchValue) || author.includes(searchValue) || levelId.includes(searchValue);
            const matchesType = typeValue === "" || type === typeValue;
            const matchesNoclip = noclipValue === "" || (noclipValue === "yes" && noclip === "yes") || (noclipValue === "no" && noclip === "no");

            return matchesSearch && matchesType && matchesNoclip;
        });

        renderMacros(filteredList);
    }

    searchInput.addEventListener("input", filterAndRender);
    fileTypeFilter.addEventListener("change", filterAndRender);
    noclipFilter.addEventListener("change", filterAndRender);

    loadMacros();
});