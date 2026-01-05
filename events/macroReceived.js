const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../handlers/database.js');
const macros = new Set();

module.exports = {
    name: 'macroReceived',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Object} macro
     */
    run: async (macro, client) => {
        const key = `${macro.userID}-${macro.id}`;

        if (macros.has(key)) return;
        if (!fs.existsSync(macro.filePath)) return;
        macros.add(key);

        try {
            const guild = client.guilds.cache.get(client.config.serverId);
            let channel;

            for (const [type, extensions] of Object.entries(client.config.fileTypes)) {
                if (extensions.includes(macro.type.slice(1))) channel = guild.channels.cache.get(client.config.channels[type]);
            }

            const user = await client.users.fetch(macro.userID);
            const name = macro.name.replaceAll('_', ' ');

            const title = `${name} made by ${macro.author} | Noclip: ${macro.noclip} | ID: ${macro.id}`;
            const notes = macro.notes.length > 0 ? `Additional Notes: ${macro.notes}` : "";

            const embed = new Discord.EmbedBuilder()
                .setAuthor({
                    name: user.username,
                    iconURL: user.displayAvatarURL()
                })
                .setDescription(`${title}\n\n${notes}`)
                .setColor('Blurple')
                .setFooter({
                    text: 'File Attached below'
                })

            const thread = await channel.threads.create({
                name: title,
                message: {
                    embeds: [embed]
                }
            });

            if (macro.size > 10) {
                const folder = path.join(__dirname, "../macros", thread.id);
                if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

                const filePath = path.join(folder, macro.originalFileName);
                if (fs.existsSync(macro.filePath)) fs.renameSync(macro.filePath, filePath);

                const downloadedMacro = `${client.config.urls.base}download/${thread.id}/download`;

                const Button = new Discord.ButtonBuilder()
                    .setLabel('Download Macro (above 10mb)')
                    .setStyle(Discord.ButtonStyle.Link)
                    .setURL(downloadedMacro)

                const ActionRow = new Discord.ActionRowBuilder()
                    .addComponents(Button)

                await thread.send({
                    content: `<@${user.id}>`,
                    components: [ActionRow]
                });

                db.push({
                    name: macro.name,
                    author: macro.author,
                    levelId: macro.id,
                    noclip: macro.noclip,
                    notes: macro.notes,
                    type: macro.type.slice(1),
                    channelId: thread.id,
                    userId: user.id
                });
            } else {
                if (fs.existsSync(macro.filePath)) {
                    await thread.send({ content: `<@${user.id}>`, files: [macro.filePath] });
                    
                    db.push({
                        name: macro.name,
                        author: macro.author,
                        levelId: macro.id,
                        noclip: macro.noclip,
                        notes: macro.notes,
                        type: macro.type.slice(1),
                        channelId: thread.id,
                        userId: user.id
                    });

                    try {
                        fs.unlinkSync(macro.filePath);
                    } catch (err) {
                        console.log("Error deleting file:", err);
                    }
                }
            }
        } catch (error) {
            console.log(error);
        } finally {
            setTimeout(() => {
                macros.delete(key);
            }, 5000);
        }
    }
}