const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');
const server = require('../dashboard/server.js');
const db = require('../managers/database.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const levelId = interaction.options.getString("id");
    if (!interaction.channel.isThread()) return interaction.reply({
        content: 'This channel is not a thread',
        flags: Discord.MessageFlags.Ephemeral
    });

    await interaction.deferReply();

    const regex = /(.*?) made by (.*?) \| Noclip: (.*?) \| ID: (\d+)/;
    const match = interaction.channel.name.match(regex);

    const levelInfo = await server.fetchLevel(levelId);
    if (!levelInfo.found) {
        console.log(`[ERROR] Failed to fetch level: ${levelId}`);
        return interaction.editReply({
            content: '❌ Could not fetch level'
        });
    }

    const newName = levelInfo.name;
    const newAuthor = levelInfo.author;

    if (match) {
        const [, name, author, noclip, id] = match;
        const newChannelName = interaction.channel.name.replace(name, newName).replace(`made by ${author}`, `made by ${newAuthor}`).replace(`ID: ${id}`, `ID: ${levelId}`);
        let currentMessage = '';

        // update channel name

        try {
            currentMessage = currentMessage + '✅ Channel name updated';
            await interaction.channel.setName(newChannelName);
        } catch (error) {
            currentMessage = currentMessage + '❌ Failed to change channel name';
            console.log(`[ERROR] Failed to update channel name: ${error}`);
        }

        // update embed

        try {
            currentMessage = currentMessage + '\n✅ Embed updated';

            const message = await interaction.channel.fetchStarterMessage();
            const embed = message.embeds[0];

            const newEmbed = Discord.EmbedBuilder.from(embed)
                .setDescription(embed.description.replace(name, newName).replace(`made by ${author}`, `made by ${newAuthor}`).replace(`ID: ${id}`, `ID: ${levelId}`))

            await message.edit({
                embeds: [newEmbed]
            });
        } catch (error) {
            currentMessage = currentMessage + '\n❌ Failed to update embed'
            console.log(`[ERROR] Failed to update embed: ${error}`);
        }

        // update db

        try {
            currentMessage = currentMessage + '\n✅ DB updated';
            db.change(interaction.channel.id, 'name', newName);
            db.change(interaction.channel.id, 'author', newAuthor);
            db.change(interaction.channel.id, 'levelId', levelId);
        } catch (error) {
            currentMessage = currentMessage + '\n❌ Failed to update db'
            console.log(`[ERROR] Failed to update db: ${error}`);
        }

        await interaction.editReply({
            content: currentMessage
        });
    } else {
        console.log(`[ERROR] Failed to match channel name: ${interaction.channel.name}, expected input NAME made by AUTHOR | Noclip: NOCLIP | ID: levelId`);
        await interaction.editReply({
            content: '❌ Failed to find matches in the channel name'
        });
    }

}

module.exports.data = new SlashCommand()
    .setName('edit-channel')
    .setDescription('Edit the channel info')
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
    .addStringOption(option => option
        .setName("id")
        .setDescription("Level id")
        .setRequired(true))