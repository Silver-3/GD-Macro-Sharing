const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    client.user.setActivity(`Watching over ${client.guilds.cache.get(client.config.serverId).name}`, {
        type: Discord.ActivityType.Watching
    });

    interaction.reply({ content: '✅ Activity fixed' });
}

module.exports.data = new SlashCommand()
    .setName('fix-activity')
    .setDescription('Fix bot activity')
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)