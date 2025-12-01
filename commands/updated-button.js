const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    await interaction.deferReply();

    try {
        const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
            .setLabel("Download Macro (above 10mb)")
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(`${client.config.url}download/${interaction.channel.id}/download`)
        );

        interaction.editReply({ 
            content: "Here is the updated button", 
            components: [row] 
        });
    } catch (error) {
        interaction.editReply("Button was not found, please use this in a channel with a 'Download Macro' button")
    }
}

module.exports.data = new SlashCommand()
    .setName('updated-button')
    .setDescription('Get an updated button to download the macro')