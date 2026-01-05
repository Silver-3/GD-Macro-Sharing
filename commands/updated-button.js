const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const messages = await interaction.channel.messages.fetch({ limit: 2, after: interaction.channel.id });
    const message = messages.at(-1);

    if (interaction.channel.isThread() && message.components[0]) {
        const button = new Discord.ButtonBuilder()
            .setLabel("Download Macro (above 10mb)")
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(`${client.config.urls.base}download/${interaction.channel.id}/download`)

        const row = new Discord.ActionRowBuilder()
            .addComponents(button)

        interaction.reply({ 
            content: "Here is the updated button", 
            components: [row] 
        });
    } else {
        interaction.reply({
            content: "Button was not found, please use this in a channel with a 'Download Macro' button",
            flags: Discord.MessageFlags.Ephemeral
        });
    }
}

module.exports.data = new SlashCommand()
    .setName('updated-button')
    .setDescription('Get an updated button to download the macro')

module.exports.data.devOnly = false;