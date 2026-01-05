const SlashCommand = require('@discordjs/builders').SlashCommandBuilder;
const Discord = require('discord.js');

/**
 * @param {Discord.Client} client 
 * @param {Discord.CommandInteraction} interaction 
 */
module.exports.run = async (interaction, client) => {
    const subcommand = interaction.options.getSubcommand();

    try {
        await interaction.channel.bulkDelete(5);
    } catch (error) {
        console.log(`Failed to clear channel for ${subcommand}: ${error}`);
    }
    interaction.reply({
        content: 'Clearing channel and preparing to setup...',
        flags: Discord.MessageFlags.Ephemeral
    });

    const pingForError = new Discord.EmbedBuilder()
        .setTitle('If you have issues')
        .setDescription(`If the bot or the website is offline or has problems then ping <@${client.config.devId}> in <#1216316500130926633>\n`)
        .setColor('Blurple')

    if (subcommand == 'macros') {
        const submitEmbed = new Discord.EmbedBuilder()
            .setTitle('Click below to submit a macro')
            .setDescription(`\n\n-# If you need help, please DM <@${client.config.devId}>`)
            .setColor('Blurple')

        const submitButton = new Discord.ButtonBuilder()
            .setLabel('Submit a macro')
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(client.config.urls.base + 'submit-macro');

        const submitActionRow = new Discord.ActionRowBuilder()
            .addComponents(submitButton)

        const searchEmbed = new Discord.EmbedBuilder()
            .setTitle('Click below to search for a macro')
            .setDescription(`Shouldn't need an explanation, just type in to search`)
            .setColor('Blurple')

        const searchButton = new Discord.ButtonBuilder()
            .setLabel('Browse Macros')
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(client.config.urls.base + 'browse-macros');

        const searchActionRow = new Discord.ActionRowBuilder()
            .addComponents(searchButton)

        interaction.channel.send({
            embeds: [submitEmbed],
            components: [submitActionRow]
        });
        interaction.channel.send('_ _');
        interaction.channel.send({
            embeds: [searchEmbed],
            components: [searchActionRow]
        });
        interaction.channel.send('_ _');
        interaction.channel.send({
            embeds: [pingForError]
        });
    } else if (subcommand == 'rules') {
        const rulesEmbed = new Discord.EmbedBuilder()
            .setTitle('Rules')
            .setDescription('1. No NSFW content\n2. No offensive or harmful content\n3. Use designated channels\n4. Avoid spam\n5. Use common sense')
            .setColor('Blurple')

        interaction.channel.send({
            embeds: [rulesEmbed]
        });

        interaction.channel.send("__**Invite link for this server**__\n" + client.config.urls.invite)
    } else if (subcommand == 'self-roles') {
        const selfRolesEmbed = new Discord.EmbedBuilder()
            .setTitle('Self Roles')
            .setDescription('Click below to receive your roles')
            .setColor('Blurple')

        const announcementButton = new Discord.ButtonBuilder()
            .setCustomId('role_announcement')
            .setLabel('Announcement Ping')
            .setStyle(Discord.ButtonStyle.Primary)

        const eventButton = new Discord.ButtonBuilder()
            .setCustomId('role_event')
            .setLabel('Event Ping')
            .setStyle(Discord.ButtonStyle.Primary)

        const roleActionRow = new Discord.ActionRowBuilder()
            .addComponents(announcementButton, eventButton)

        interaction.channel.send({
            embeds: [selfRolesEmbed],
            components: [roleActionRow]
        });
    } else if (subcommand == 'ticket') {
        const embed = new Discord.EmbedBuilder()
            .setTitle('Submit event macro')
            .setDescription('This is only to upload your macro for <#1295496038811045908>\nIf you are going to open a ticket for no reason or to upload a normal macro, you can be blacklisted\n\nPress the button below to open a ticket')
            .setColor('Blurple')

        const button = new Discord.ButtonBuilder()
            .setCustomId('ticket_open')
            .setLabel('Open Ticket')
            .setStyle(Discord.ButtonStyle.Secondary)
            
        const actionRow = new Discord.ActionRowBuilder()
            .addComponents(button)

        interaction.channel.send({
            embeds: [embed],
            components: [actionRow]
        });
    }
}

module.exports.data = new SlashCommand()
    .setName('setup')
    .setDescription('Setup for several things')
    .addSubcommand(subcommand => subcommand
        .setName('macros')
        .setDescription('Setup macro submittion'))
    .addSubcommand(subcommand => subcommand
        .setName('rules')
        .setDescription('Setup rules'))
    .addSubcommand(subcommand => subcommand
        .setName('self-roles')
        .setDescription('Setup self roles'))
    .addSubcommand(subcommand => subcommand
        .setName("ticket")
        .setDescription("Setup event ticket"))

module.exports.data.devOnly = true;