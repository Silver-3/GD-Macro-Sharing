const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');
const server = require('../dashboard/server.js');
const db = require('../handlers/database.js');

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

        try {
            await interaction.channel.setName(newChannelName);
            currentMessage = currentMessage + '✅ Channel name updated';
        } catch (error) {
            console.log(`[ERROR] Failed to update channel name: ${error}`);
            currentMessage = currentMessage + '❌ Failed to change channel name';
        }

        try {
            const message = await interaction.channel.fetchStarterMessage();
            const embed = message.embeds[0];

            const newEmbed = Discord.EmbedBuilder.from(embed)
                .setDescription(embed.description.replace(name, newName).replace(`made by ${author}`, `made by ${newAuthor}`).replace(`ID: ${id}`, `ID: ${levelId}`))

            await message.edit({
                embeds: [newEmbed]
            });

            currentMessage = currentMessage + '\n✅ Embed updated';
        } catch (error) {
            console.log(`[ERROR] Failed to update embed: ${error}`);
            currentMessage = currentMessage + '\n❌ Failed to update embed'
        }

        try {
            db.change(interaction.channel.id, 'name', newName);
            db.change(interaction.channel.id, 'author', newAuthor);
            db.change(interaction.channel.id, 'levelId', levelId);
            currentMessage = currentMessage + '\n✅ DB updated';
        } catch (error) {
            console.log(`[ERROR] Failed to update db: ${error}`);
            currentMessage = currentMessage + '\n❌ Failed to update db'
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
    .addStringOption(option => option
        .setName("id")
        .setDescription("Level id")
        .setRequired(true))

module.exports.data.devOnly = true;