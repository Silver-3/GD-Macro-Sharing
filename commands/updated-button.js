const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    await interaction.deferReply();

    const messages = await interaction.channel.messages.fetch({ after: "0", limit: 2 });
    const sorted = messages.sort((a, b) => a.id - b.id);
    const message = sorted.at(1);

    const url = message.components[0].components[0].data.url;
    const formatUrl = new URL(url).pathname.slice(1);

    const row = new Discord.ActionRowBuilder().addComponents(
        new Discord.ButtonBuilder()
            .setLabel("Download Macro (above 10mb)")
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(`${client.config.url}${formatUrl}`)
        );

    interaction.editReply({ 
        content: "Here is the updated button", 
        components: [row] 
    });
}

module.exports.data = new SlashCommand()
    .setName('updated-button')
    .setDescription('Get an updated button to download the macro')