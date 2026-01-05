window.addEventListener('DOMContentLoaded', () => {
    async function loadLeaderboard() {
        const container = document.getElementById('leaderboard-container');
        const footer = document.getElementById('total-macros');

        try {
            const response = await fetch('/api/leaderboard');
            const data = await response.json();

            if (!data.leaderboard || data.leaderboard.length === 0) {
                container.innerHTML = '<p>No macros uploaded yet!</p>';
                return;
            }

            let html = '<table style="width:100%; text-align: left; border-collapse: collapse;">';
            data.leaderboard.forEach((user, index) => {
                const highlight = user.isMe ? ' <span style="color: #5865F2;">(You)</span>' : '';
                const rowStyle = user.isMe ? 'background: rgba(88, 101, 242, 0.1);' : '';

                html += `
                    <tr style="${rowStyle} border-bottom: 1px solid #333;">
                        <td style="padding: 10px;">#${index + 1}</td>
                        <td style="padding: 10px;">
                            <img src="${user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}" style="width:30px; border-radius:50%; vertical-align:middle; margin-right:10px;">
                            <strong>${user.username}</strong>${highlight}
                        </td>
                        <td style="padding: 10px; text-align: right;">${user.count} macros</td>
                    </tr>
                `;
            });
            html += '</table>';

            container.innerHTML = html;
            footer.innerText = `Total macros uploaded in this server: ${data.totalMacros}`;

        } catch (err) {
            container.innerHTML = '<p>❌ Failed to build leaderboard</p>';
        }
    }

    loadLeaderboard();
});