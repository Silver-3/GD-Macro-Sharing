const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

const path = require('path');
const fs = require('fs');
const Server = require('../dashboard/server.js');

const macroFilePath = path.join(__dirname, '../macros.json');
const loadMacros = () => JSON.parse(fs.readFileSync(macroFilePath, 'utf8'));

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const macros = loadMacros();

    function findMatch(data, searchId) {
        for (const key in data.stored) {
            if (Array.isArray(data.stored[key])) {
                const index = data.stored[key].findIndex(item => item.channelId == searchId);

                if (index !== -1) {
                    data.stored[key].splice(index, 1);
                    return true
                }
            }
        }
        return false
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle('Confirmation')
        .setColor('Blurple')
        .setDescription('Are you sure you want to delete this macro?')

    const timeoutEmbed = new Discord.EmbedBuilder()
        .setTitle('Deletion cancelled')
        .setColor('Blurple')
        .setDescription('Delete macro timed out')

    const confirmationEmbed = new Discord.EmbedBuilder()
        .setTitle('Macro deleted')
        .setColor('Blurple')
        .setDescription('Macro has been deleted and the channel removed')

    const cancelledEmbed = new Discord.EmbedBuilder()
        .setTitle('Deletion cancelled')
        .setColor('Blurple')
        .setDescription('Macro deletion has been cancelled')

    const yesButton = new Discord.ButtonBuilder()
        .setCustomId('deleteMacroYes')
        .setLabel('Delete')
        .setStyle(Discord.ButtonStyle.Success)

    const noButton = new Discord.ButtonBuilder()
        .setCustomId('deleteMacroNo')
        .setLabel('Cancel')
        .setStyle(Discord.ButtonStyle.Danger)

    const row = new Discord.ActionRowBuilder()
        .addComponents(yesButton, noButton)

    const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: Discord.MessageFlags.Ephemeral
    });

    const collector = message.createMessageComponentCollector({ componentType: Discord.ComponentType.Button, time: 30000, max: 1 });

    collector.on('collect', (i) => {
        if (i.customId == 'deleteMacroYes') {
            findMatch(macros, channel.id);
            Server.updateMacros(macros);
            channel.delete();

            if (channel.id !== interaction.channel.id) message.edit({
                embeds: [confirmationEmbed],
                components: []
            });
        } else if (i.customId == 'deleteMacroNo') {
            message.edit({
                embeds: [cancelledEmbed],
                components: []
            });
        }
    });

    collector.on('end', (collected) => {
        if (collected.size == 0 || collected.size == null) message.edit({
            embeds: [timeoutEmbed],
            components: []
        });
    });
}

module.exports.data = new SlashCommand()
    .setName('delete-macro')
    .setDescription('Delete a macro if its a dupe')
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
    .addChannelOption(option => option
        .setName("channel")
        .setDescription("Channel to delete"))