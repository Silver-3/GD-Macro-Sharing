const Discord = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Discord.GuildMember} member
     */
    run: async (member, client) => {        
        const welcomeChannel = member.guild.channels.cache.get(client.config.server.welcomeChannelId);

        const embed = new Discord.EmbedBuilder()
            .setTitle('Member Joined')
            .setDescription(`Everyone welcome our new member, <@${member.id}> to ${member.guild.name}`)
            .setColor('Green')

        welcomeChannel.send({
            embeds: [embed]
        });

        member.roles.add(client.config.server.memberRole);
    }
}