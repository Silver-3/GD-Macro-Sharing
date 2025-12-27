const Discord = require('discord.js');

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Discord.GuildMember} member
     */
    run: async (member, client) => {        
        const welcomeChannel = member.guild.channels.cache.get(client.config.channels.welcome);

        const embed = new Discord.EmbedBuilder()
            .setTitle('Member Joined')
            .setDescription(`Everyone welcome our new member, <@${member.id}> to ${member.guild.name}`)
            .setColor('Green')

        try {
            welcomeChannel.send({
                embeds: [embed]
            });

            member.roles.add(client.config.roles.member);
        } catch (error) {
            console.log('Failed to send join message/add role: ' + error)
        }
    }
}