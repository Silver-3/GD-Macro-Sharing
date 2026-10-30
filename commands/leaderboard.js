const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');
const db = require('../handlers/database.js');
const Canvas = require('@napi-rs/canvas');

async function tallyMacros() {
    const rows = await db.all();
    const counts = new Map();

    for (const row of rows) {
        const userId = row.userId || row.userID;
        if (!userId) continue;

        counts.set(userId, (counts.get(userId) || 0) + 1);
    }
    return counts;
}

async function leaderboardImage(data) {
    const width = 750;
    const rowHeight = 80;
    const canvasHeight = (data.length * rowHeight);

    const canvas = Canvas.createCanvas(width, canvasHeight);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, canvasHeight);

    let currentY = 0;

    for (let i = 0; i < data.length; i++) {
        const user = data[i];

        // Divider when there is a gap in ranks (the viewer's row below the top 10)
        if (i > 0 && user.rank !== data[i - 1].rank + 1) {
            ctx.fillStyle = '#666666';
            ctx.fillRect(30, currentY, width - 60, 1);
        }

        if (user.isMe) {
            ctx.fillStyle = 'rgba(88, 101, 242, 0.1)';
            ctx.fillRect(10, currentY + 5, width - 20, rowHeight - 10);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.fillText(`#${user.rank}`, 30, currentY + 45);

        const avatarUrl = user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
        const avatarImg = await Canvas.loadImage(avatarUrl);

        ctx.save();
        ctx.beginPath();
        ctx.arc(110, currentY + 40, 25, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarImg, 85, currentY + 15, 50, 50);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(user.username, 160, currentY + 45);

        if (user.isMe) {
            const nameWidth = ctx.measureText(user.username).width;
            ctx.fillStyle = '#5865F2';
            ctx.font = '20px sans-serif';
            ctx.fillText('(You)', 170 + nameWidth, currentY + 45);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '22px sans-serif';
        const countText = `${user.count} macros`;
        ctx.fillText(countText, width - 40 - ctx.measureText(countText).width, currentY + 45);

        currentY += rowHeight;
    }

    return canvas.toBuffer('image/png');
}

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const counts = await tallyMacros();
    const sortedAll = [...counts.entries()].sort(([, a], [, b]) => b - a);
    const totalMacros = sortedAll.reduce((sum, [, c]) => sum + c, 0);

    const buildEntry = async (userID, total, rank) => {
        try {
            const user = await interaction.client.users.fetch(userID);
            return {
                rank,
                username: user.globalName || user.username,
                avatar: user.displayAvatarURL({
                    extension: 'png',
                    size: 64
                }),
                count: total,
                isMe: userID === interaction.user.id
            };
        } catch {
            return {
                rank,
                username: "Unknown",
                avatar: null,
                count: total,
                isMe: false
            };
        }
    };

    const leaderboardData = await Promise.all(
        sortedAll.slice(0, 10).map(([userID, total], i) => buildEntry(userID, total, i + 1))
    );

    // If the user isn't in the top 10 but has uploaded macros, add their row below
    if (!leaderboardData.some(u => u.isMe)) {
        const idx = sortedAll.findIndex(([id]) => id === interaction.user.id);

        if (idx !== -1) {
            leaderboardData.push(await buildEntry(interaction.user.id, sortedAll[idx][1], idx + 1));
        }
    }

    const image = await leaderboardImage(leaderboardData);
    const attachment = new Discord.AttachmentBuilder(image, {
        name: 'leaderboard.png'
    });

    const embed = new Discord.EmbedBuilder()
        .setTitle('Macro Upload Leaderboard')
        .setColor('Blurple')
        .setImage('attachment://leaderboard.png')
        .setFooter({
            text: `Total macros uploaded in this server: ${totalMacros}`
        })

    await interaction.reply({
        embeds: [embed],
        files: [attachment]
    });
}

module.exports.data = new SlashCommand()
    .setName('leaderboard')
    .setDescription('See who has uploaded the most macros')

module.exports.data.devOnly = false;