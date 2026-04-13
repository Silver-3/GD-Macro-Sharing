const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const member = interaction.options.getMember("user");

    member.roles.add(client.config.roles.img);
    interaction.reply({ content: `<@${member.id}> has been whitelisted`});
}

module.exports.data = new SlashCommand()
    .setName('whitelist')
    .setDescription('Whitelist someone from attachment detection')
    .addUserOption(option => option
        .setName("user")
        .setDescription("User to whitelist")
        .setRequired(true))

module.exports.data.devOnly = true;