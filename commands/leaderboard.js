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

        if (user.isMe) {
            ctx.fillStyle = 'rgba(88, 101, 242, 0.1)';
            ctx.fillRect(10, currentY + 5, width - 20, rowHeight - 10);
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.fillText(`#${i + 1}`, 30, currentY + 45);

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
    const sorted = [...counts.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

    const totalMacros = [...counts.values()].reduce((a, b) => a + b, 0);

    const leaderboardData = await Promise.all(sorted.map(async ([userID, total]) => {
        try {
            const user = await interaction.client.users.fetch(userID);
            return {
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
                username: "Unknown",
                avatar: null,
                count: total,
                isMe: false
            };
        }
    }));

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