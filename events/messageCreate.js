const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const Server = require('../server.js');

const macroFilePath = path.join(__dirname, '../macros.json');
const loadMacros = () => JSON.parse(fs.readFileSync(macroFilePath, 'utf8'));

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * @param {Discord.Message} message
     * @param {Discord.Client} client 
     */
    run: async (message, client) => {
        if (!message.guild || message.author.bot) return;
        if (message.author.id !== client.config.devId) return;

        if (message.content.includes('eval')) {

            const codeButton = new Discord.ButtonBuilder()
                .setCustomId('code_eval')
                .setLabel('Submit Code')
                .setStyle(Discord.ButtonStyle.Primary)

            const codeActionRow = new Discord.ActionRowBuilder()
                .addComponents(codeButton)

            message.delete();
            message.channel.send({
                components: [codeActionRow]
            });
        } else if (message.content.includes('change name')) {
            let msg = await message.channel.send("What would you like to change the channel name to?");

            const filter = m => m.author.id == message.author.id;
            const collector = message.channel.createMessageCollector({
                filter: filter,
                time: 15000
            });

            let sendMsg;
            let msg2;

            collector.on('collect', async (m) => {
                sendMsg = m;
                message.channel.setName(m.content);
                msg2 = await message.channel.send("Channel name changed to: " + m.content);
                collector.stop();
            });

            collector.on('end', async () => {
                message.delete();
                sendMsg.delete();
                msg.delete();

                setTimeout(() => {
                    msg2.delete().catch(err => err);
                }, 2500);
            });
        } else if (message.content.startsWith('clone')) {
            const args = message.content.slice(6).split(' ');

            if (args[0].length > 0 && !isNaN(args[0].match(/\d+/)[0])) {
                const channelId = args[0].match(/\d+/)[0];
                const channel = await client.channels.cache.get(channelId);
                if (!channel) return message.channel.send("Channel ID is invalid");

                let messages = [];
                let lastMessageId = null;

                try {
                    do {
                        const fetchedMessages = await channel.messages.fetch({
                            limit: 100,
                            before: lastMessageId
                        });

                        if (fetchedMessages.size === 0) break;

                        messages = [...fetchedMessages.values(), ...messages];
                        lastMessageId = fetchedMessages.last().id;
                    } while (true);

                    const messageArray = messages.reverse();

                    let threadId = null;
                    let currentChannel = message.channel;

                    if (message.channel.isThread()) threadId = message.channel.id;
                    if (message.channel.isThread()) currentChannel = message.channel.parent;

                    client.fakeWebhook(messageArray, currentChannel, client, threadId);
                    message.delete();

                } catch (error) {
                    console.error("Error fetching messages:", error);
                    message.channel.send("An error occurred while copying messages.");
                }

            } else {
                // clone current thread to new channel
                const messages = await message.channel.messages.fetch();
                const messageArray = Array.from(messages.values()).reverse();

                const embed = messageArray[0].embeds[0];
                if (!embed) return message.channel.send("Channel id is not a thread");

                const attachment = messageArray[1].attachments.first();
                const mention = messageArray[1].mentions.users.first();

                if (!attachment) return message.channel.send("Channel id is not a thread");
                if (!mention) return message.channel.send("Channel id is not a thread");

                let fileType = attachment.name.split('.').pop();
                if (fileType == 'json') fileType = 'gdr';
                if (fileType == 're2') fileType = 're';
                fileType = '.' + fileType;

                const parts = message.channel.name.split(' | ');
                const nameAuthor = parts[0].split(' made by ');

                let user = client.users.cache.get(mention.id)
                if (user) user = user.id;
                if (!user) user = client.user.id;
                
                let notes = embed.data.description.toLowerCase().split('notes: ').pop().trim();
                if (notes.startsWith(nameAuthor[0].trim().toLowerCase())) notes = "";

                const macro = {
                    userID: user,
                    id: parts[2].split('ID: ').pop().trim(),
                    name: nameAuthor[0].trim(),
                    author: nameAuthor[1].trim(),
                    originalFileName: attachment.name,
                    filePath: attachment.attachment,
                    size: (attachment.size / (1024 * 1024)).toFixed(2),
                    type: fileType,
                    noclip: parts[1].split('Noclip: ').pop().trim(),
                    notes: notes,
                    clone: message.channel
                }

                message.delete();
                client.emit('macroReceived', macro);
            }
        } else if (message.content.includes('dev cmds')) {
            const embed = new Discord.EmbedBuilder()
                .setTitle('Dev commands')
                .setDescription('eval - Execute javascript code\nchange name - Change the name of the channel/thread\nclone - Clone current thread to new channel\nembed title - Create an embed\ndeletemacro id - Delete an macro with id\ndeletechannel - Delete the current channel')
                .setColor('Blurple')

            const deleteButton = new Discord.ButtonBuilder()
                .setCustomId('delete')
                .setLabel('Delete')
                .setStyle(Discord.ButtonStyle.Danger)

            const deleteActionRow = new Discord.ActionRowBuilder()
                .addComponents(deleteButton)

            message.delete();

            message.channel.send({
                embeds: [embed],
                components: [deleteActionRow]
            });
        } else if (message.content.startsWith('embed')) {
            const title = message.content.slice(6);
            if (!title.length > 0) return message.channel.send('Please provide a title for the embed');

            const msg = await message.channel.send('What would you like to put as the description?');
            const collector = await message.channel.createMessageCollector({
                filter: m => m.author.id === message.author.id,
                time: 60000
            });

            collector.on('collect', async (m) => {
                const embed = new Discord.EmbedBuilder()
                    .setTitle(title)
                    .setDescription(m.content)
                    .setColor('Blurple')

                message.channel.send({
                    embeds: [embed]
                });

                m.delete();
                collector.stop();
            });

            collector.on('end', () => {
                message.delete();
                msg.delete();
            });
        } else if (message.content.startsWith('deletemacro')) {
            const id = message.content.slice(12);
            const macros = loadMacros();

            function findMatch(data, searchId) {
                for (const key in data.stored) {
                    if (Array.isArray(data.stored[key])) {
                        const index = data.stored[key].findIndex(item => item.channelId == searchId);

                        if (index !== -1) {
                            data.stored[key].splice(index, 1);
                            return true
                        }
                    }
                }
                return false
            }

            message.channel.send(`${findMatch(macros, id) ? 'Macro deleted successfully' : 'Macro not found'}`);
            Server.updateMacros(macros);
        } else if (message.content == "deletechannel") {
            message.channel.delete();
        }
    }
}