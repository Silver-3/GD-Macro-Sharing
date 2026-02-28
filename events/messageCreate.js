const Discord = require('discord.js');

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * @param {Discord.Message} message
     * @param {Discord.Client} client 
     */
    run: async (message, client) => {
        if (!message.guild || message.author.bot) return;

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = message.content.match(urlRegex);

        if ((links && links.length >= 3) || (message.attachments && message.attachments.size >= 3)) {
            try {
                await message.delete();
                const member = await message.guild.members.fetch(message.author.id);

                try {
                	await member.timeout(10 * 60 * 1000, "Possible scam");
                } catch (error) {
                    console.log(`[ERROR] Failed to time out member: ${error}`);
                }

                let loggedContent = message.content || "";

                if (message.attachments && message.attachments.size > 0) {
                    const attachmentNames = message.attachments.map(a => `📎 [Attachment: ${a.name}]`).join('\n');
                    loggedContent = loggedContent ? `${loggedContent}\n\n${attachmentNames}` : attachmentNames;
                }

                if (loggedContent.length > 4096) {
                    loggedContent = loggedContent.substring(0, 4093) + "...";
                }

                const channel = await message.guild.channels.fetch(client.config.channels.automod);
                const automodEmbed = new Discord.EmbedBuilder()
                    .setAuthor({ name: member.user.username, iconURL: member.displayAvatarURL()})
                    .setDescription(loggedContent)
                    .setFooter({text: (links && links.length >= 3) ? "3+ links sent" : "3+ attachments sent"})

                channel.send({
                    content: `Blocked a message in <#${message.channel.id}> `,
                    embeds: [automodEmbed]
                });
            } catch (error) {
                console.log(`[ERROR] Error in scam automod\n${error}`);
            }
        }
        
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
        } 
    }
}