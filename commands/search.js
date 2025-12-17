const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');
const db = require('../managers/database.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const by = interaction.options.getString('by');
    const search = interaction.options.getString('search').toLowerCase();
    const type = interaction.options.getString('type');
    const noclip = interaction.options.getString('noclip');

    if (interaction.channel.id !== client.config.commandsChannel) return interaction.reply({
        content: `You can only use this command in <#${client.config.commandsChannel}>`,
        flags: Discord.MessageFlags.Ephemeral
    });

    await interaction.deferReply();

    try {
        const macros = await db.all();
        let results = macros.filter(macro => {
            if (type && macro.type !== type) return false;
            if (noclip !== null && (macro.noclip.toLowerCase() !== noclip)) return false;

            if (by == 'any') return (macro.name.toLowerCase().includes(search) || macro.author.toLowerCase().includes(search) || String(macro.levelId) == search || String(macro.id) == search);
            else if (by == 'name') return macro.name.toLowerCase().includes(search);
            else if (by == 'author') return macro.author.toLowerCase().includes(search);
            else if (by == 'id') return String(macro.levelId) == search || String(macro.id) == search;

            return false;
        });

        const noResultsEmbed = new Discord.EmbedBuilder()
            .setTitle('No results found')
            .setDescription(`No results for \`${search}\` with filters \`by: ${by}, type: ${type !== null ? type : 'any'}, noclip: ${noclip !== null ? noclip : 'any'}\``)
            .setColor('Blurple')

        if (results.length == 0) return interaction.editReply({
            embeds: [noResultsEmbed]
        });

        const embed = new Discord.EmbedBuilder()
            .setTitle(`Macros matching ${search} (${by})`)
            .setColor('Blurple')

        results = results.slice(0, 25);

        const fieldPromises = results.map(async macro => {
            const channel = await interaction.guild.channels.fetch(macro.channelId);

            return {
                name: channel ? channel.name : 'Unknown Channel',
                value: `<#${channel.id}> (${macro.type})`
            };  
        });

        const fields = await Promise.all(fieldPromises);
        embed.addFields(fields);

        interaction.editReply({
            embeds: [embed]
        });
    } catch (error) {
        console.error("Error in search command:", error);
        interaction.editReply({
            content: 'Something went wrong with searching the database.'
        });
    }
}

module.exports.data = new SlashCommand()
    .setName('search')
    .setDescription('Search for a macro within discord')
    .addStringOption(option => option
        .setName("by")
        .setDescription("What do you want to search for a level by")
        .setRequired(true)
        .addChoices({
            name: 'Any',
            value: 'any'
        },{
            name: 'Name',
            value: 'name'
        }, {
            name: 'Author',
            value: 'author'
        }, {
            name: 'ID',
            value: 'id'
        }))
    .addStringOption(option => option
        .setName("search")
        .setDescription("Input something to search")
        .setRequired(true))
    .addStringOption(option => option
        .setName("type")
        .setDescription("Filter by type if you want")
        .addChoices({
            name: 'gdr',
            value: 'gdr'
        }, {
            name: 'mhr',
            value: 'mhr'
        }, {
            name: 're',
            value: 're'
        }, {
            name: 'xd',
            value: 'xd'
        }))
    .addStringOption(option => option
        .setName("noclip")
        .setDescription("Noclip on or off")
        .addChoices({
            name: 'Yes',
            value: 'yes'
        }, {
            name: 'No',
            value: 'no'
        }))