const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');
const db = require('../managers/database.js');

module.exports = {
    name: 'macroReceived',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Object} macro
     */
    run: async (macro, client) => {
        const guild = client.guilds.cache.get(client.config.server);

        let channel;
        const channelId = {
            gdr: client.config.gdrChannel,
            mhr: client.config.mhrChannel,
            re: client.config.reChannel,
            xd: client.config.xdChannel
        }

        if (macro.type == '.gdr' || macro.type == '.json') channel = guild.channels.cache.get(channelId.gdr);
        else if (macro.type == '.mhr') channel = guild.channels.cache.get(channelId.mhr);
        else if (macro.type == '.re' || macro.type == '.re2') channel = guild.channels.cache.get(channelId.re)
        else if (macro.type == '.xd') channel = guild.channels.cache.get(channelId.xd);

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

            if (!fs.existsSync(folder)) {
                fs.mkdirSync(folder, { recursive: true});
            }

            const filePath = path.join(folder, macro.originalFileName);

            fs.renameSync(macro.filePath, filePath);

            const downloadedMacro = `${client.config.url}download/${thread.id}/download`;

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

            fs.unlinkSync(macro.filePath);
        }
    }
}