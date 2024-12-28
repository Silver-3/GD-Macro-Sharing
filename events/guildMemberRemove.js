const Discord = require('discord.js');

module.exports = {
    name: 'guildMemberRemove',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Discord.GuildMember} member
     */
    run: async (member, client) => {
        const welcomeChannel = member.guild.channels.cache.get(client.config.server.welcomeChannelId);

        const embed = new Discord.EmbedBuilder()
            .setTitle('Member Left')
            .setDescription(`<@${member.id}> left ${member.guild.name}`)
            .setColor('Red')

        welcomeChannel.send({
            embeds: [embed]
        });
    }
}