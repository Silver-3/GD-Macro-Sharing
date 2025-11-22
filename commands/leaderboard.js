const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');
const fs = require('fs');

async function tallyMacros() {
    const raw = await fs.readFileSync('./macros.json', 'utf-8');
    const macros = JSON.parse(raw);

    const counts = new Map();
    function bump(userID) {
        counts.set(userID, (counts.get(userID) || 0) + 1);
    }

    for (const key of Object.keys(macros.downloads)) {
        const uid = macros.downloads[key].userID;
        if (uid) bump(uid);
    }

    for (const category of Object.values(macros.stored)) {
        for (const entry of category) {
            if (entry.userID) {
                bump(entry.userID);
            }
        }
    }

    return counts;
}

async function makeLeaderboard(counts, client, sender) {
    const sorted = [...counts.entries()]
        .sort(([,a],[,b]) => b - a)
        .slice(0, 10);

    const totalMacros = [...counts.values()].reduce((a, b) => a + b, 0);
    const fields = await Promise.all(sorted.map(async ([userID, total], i) => {
        let name = `#${i + 1}`;
        try {
            const user = await client.users.fetch(userID);
            if (user.id == sender.id) {
                name = `#${i + 1} • ${user.globalName ? user.globalName : user.username} <-- You`;
            } else {
                name = `#${i + 1} • ${user.globalName ? user.globalName : user.username} `;
            }
        } catch {};
        
        return {
            name,
            value: `<@${userID}> — ${total} macros`,
            inline: false
        };
    }));

    return new Discord.EmbedBuilder()
        .setTitle('Macro upload Leaderboard')
        .addFields(fields)
        .setColor('Blurple')
        .setFooter({text: `Total macros uploaded in this server: ${totalMacros}`})
}

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    await interaction.deferReply();

    try {
        const counts = await tallyMacros();
        const embed = await makeLeaderboard(counts, client, interaction.user);

        await interaction.editReply({
            embeds: [embed]
        });
    } catch (error) {
        console.log('[ERROR] Error when creating leaderboard: ', error);
        await interaction.editReply({
            content: `❌ Failed to build leaderboard`,
            flags: Discord.MessageFlags.Ephemeral
        });
    }
}

module.exports.data = new SlashCommand()
    .setName('leaderboard')
    .setDescription('See who has uploaded the most macros')