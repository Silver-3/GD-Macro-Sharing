const Discord = require('discord.js');

/**
 * 
 * @param {Map} messageLog 
 * @param {Discord.TextChannel} channel 
 * @param {Discord.Client} client 
 */
module.exports = async (messageLog, channel, client, threadId) => {
    const webhook = await channel.createWebhook({
        name: 'Message Cloner',
        avatar: client.user.displayAvatarURL()
    });

    if (!threadId) threadId = null;

    const filteredMessages = messageLog.filter(message => {
        return !message.author.bot && !message.content.toLowerCase().includes('clone');
    });

    for (const message of filteredMessages) {
        if (message.system || (!message.content && message.embeds.length == 0 && message.attachments.size == 0)) continue;

        if (message.content) {
            await webhook.send({
                content: message.content,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL(),
                threadId: threadId
            });
        }

        if (message.embeds.length > 0) {
            for (const embed of message.embeds) {
                await webhook.send({
                    embeds: [embed],
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL(),
                    threadId: threadId
                });
            }
        }

        if (message.attachments.size > 0) {
            for (const attachment of message.attachments.values()) {
                await webhook.send({
                    files: [attachment.url],
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL(),
                    threadId: threadId
                });
            }
        }
    }

    await webhook.delete();
}