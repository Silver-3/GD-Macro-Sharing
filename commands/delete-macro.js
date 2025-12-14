const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');
const db = require('../managers/database.js');
const fs = require('fs');
const path = require('path');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const macro = db.get(channel.id);

    if (!macro) {
        return interaction.reply({
            content: "❌ No macro found for this channel.",
            flags: Discord.MessageFlags.Ephemeral
        });
    }

    const embed = new Discord.EmbedBuilder()
        .setTitle('Confirmation')
        .setColor('Blurple')
        .setDescription(`Are you sure you want to delete **${macro.name}**?`);

    const timeoutEmbed = new Discord.EmbedBuilder()
        .setTitle('Deletion cancelled')
        .setColor('Blurple')
        .setDescription('Delete macro timed out');

    const confirmationEmbed = new Discord.EmbedBuilder()
        .setTitle('Macro deleted')
        .setColor('Blurple')
        .setDescription('Macro has been deleted and the channel removed');

    const cancelledEmbed = new Discord.EmbedBuilder()
        .setTitle('Deletion cancelled')
        .setColor('Blurple')
        .setDescription('Macro deletion has been cancelled');

    const yesButton = new Discord.ButtonBuilder()
        .setCustomId('deleteMacroYes')
        .setLabel('Delete')
        .setStyle(Discord.ButtonStyle.Success);

    const noButton = new Discord.ButtonBuilder()
        .setCustomId('deleteMacroNo')
        .setLabel('Cancel')
        .setStyle(Discord.ButtonStyle.Danger);

    const row = new Discord.ActionRowBuilder()
        .addComponents(yesButton, noButton);

    const message = await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: Discord.MessageFlags.Ephemeral
    });

    const collector = message.createMessageComponentCollector({
        componentType: Discord.ComponentType.Button,
        time: 30000,
        max: 1
    });

    collector.on('collect', async (i) => {
        if (i.customId === 'deleteMacroYes') {
            await db.delete(channel.id);

            const folderPath = path.join(__dirname, "..", "macros", channel.id);
            if (fs.existsSync(folderPath)) fs.rmSync(folderPath, { recursive: true, force: true });

            channel.delete().catch(() => {});

            if (channel.id !== interaction.channel.id) {
                await message.edit({
                    embeds: [confirmationEmbed],
                    components: []
                });
            }

        } else if (i.customId === 'deleteMacroNo') {
            await message.edit({
                embeds: [cancelledEmbed],
                components: []
            });
        }
    });

    collector.on('end', (collected) => {
        if (collected.size === 0) {
            message.edit({
                embeds: [timeoutEmbed],
                components: []
            });
        }
    });
}

module.exports.data = new SlashCommand()
    .setName('delete-macro')
    .setDescription('Delete a macro if it is a duplicate')
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
    .addChannelOption(option => option
        .setName("channel")
        .setDescription("Channel to delete"))