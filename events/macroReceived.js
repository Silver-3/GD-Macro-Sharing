const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');

const macroFilePath = path.join(__dirname, '../macros.json');
const loadMacros = () => JSON.parse(fs.readFileSync(macroFilePath, 'utf8'));
const server = require('../dashboard/server.js');

module.exports = {
    name: 'macroReceived',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Object} macro
     */
    run: async (macro, client) => {
        const guild = client.guilds.cache.get(client.config.server.serverId);
        const macros = loadMacros();

        let channel;
        const channelId = {
            gdr: client.config.server.gdrChannelId,
            mhr: client.config.server.mhrChannelId,
            re: client.config.server.reChannelId,
            xd: client.config.server.xdChannelId
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
            const downloadedMacro = `${client.config.url}download/${user.id}/${macro.name}`

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
            
            const macroKey = `${user.id}-${macro.name}`;
            
            macros.downloads[macroKey] = {
                userID: user.id,
    			id: macro.id,
    			name: macro.name,
    			author: macro.author,
    			originalFileName: macro.originalFileName,
    			filePath: macro.filePath,
    			size: macro.size,
    			type: macro.type,
    			noclip: macro.noclip,
    			notes: macro.notes,
    			link: `${client.config.url}download/${user.id}/${macro.name}`
            }

   			macros.uploads = {};
            fs.writeFileSync(macroFilePath, JSON.stringify(macros, null, 2));
        } else {
            await thread.send({ content: `<@${user.id}>`, files: [macro.filePath] });

            if (!macro.filePath.startsWith('https')) {
                macros.uploads = {};
                fs.writeFileSync(macroFilePath, JSON.stringify(macros, null, 2));
                fs.unlinkSync(macro.filePath);
            } else {
                const messages = await macro.clone.messages.fetch();
                const messageArray = Array.from(messages.values()).reverse();
                
                const deleteButton = new Discord.ButtonBuilder()
                	.setCustomId('delete_channel')
                	.setLabel('Delete channel')
                	.setStyle(Discord.ButtonStyle.Danger)
                
                const deleteActionRow = new Discord.ActionRowBuilder()
                	.addComponents(deleteButton)
           
                macro.clone.send({ content: `Thread cloned to <#${thread.id}>`, components: [deleteActionRow]});
                client.fakeWebhook(messageArray, channel, client, thread.id);
            }
        }

        let macroType = macro.type.replace('.', '');
        if (macroType == 'json') macroType = 'gdr';
        if (macroType == 're2') macroType = 're';

        const macroObject = {
            name: macro.name,
            channelId: thread.id
        }

        if (!macros.stored[macroType]) macros.stored[macroType] = [];

        macros.stored[macroType].push(macroObject);
        server.updateMacros(macros);
    }
}