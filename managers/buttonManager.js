const Discord = require('discord.js');
const requestUsers = {};

/**
 * @param {Discord.Interaction} interaction
 * @param {Discord.Client} client
 */

module.exports = async (interaction, client) => {
    if (interaction.customId === 'submit') {
        const submitButton = new Discord.ButtonBuilder()
            .setLabel('Upload a macro')
            .setStyle(Discord.ButtonStyle.Link)
            .setURL(client.config.url + 'submit-macro?userID=' + interaction.user.id);

        const submitActionRow = new Discord.ActionRowBuilder()
            .addComponents(submitButton)

        interaction.reply({
            components: [submitActionRow],
            ephemeral: true
        });
    } else if (interaction.customId === 'delete_eval' || interaction.customId === 'delete') {
        if (interaction.user.id === client.config.devId) interaction.message.delete();
    } else if (interaction.customId == 'code_eval') {
        if (interaction.user.id === client.config.devId) {
            interaction.message.delete();

            const codeModal = new Discord.ModalBuilder()
                .setCustomId('modal_eval')
                .setTitle('Code')

            const codeInput = new Discord.TextInputBuilder()
                .setCustomId('code_modal_eval')
                .setLabel('Insert your code here')
                .setStyle(Discord.TextInputStyle.Paragraph)

            const codeInputActionRow = new Discord.ActionRowBuilder()
                .addComponents(codeInput)

            codeModal.addComponents(codeInputActionRow);

            await interaction.showModal(codeModal);
        }
    } else if (interaction.customId.startsWith('role')) {
        const roleInput = interaction.customId.replace('role_', '');
        const role = interaction.guild.roles.cache.get(client.config.server[roleInput + 'Role']);

        if (interaction.member.roles.cache.has(role.id)) {
            interaction.member.roles.remove(role.id);
            interaction.reply({
                content: `You have been removed from the <@&${role.id}> role.`,
                ephemeral: true
            });
        } else {
            interaction.member.roles.add(role.id);
            interaction.reply({
                content: `You have been given the <@&${role.id}> role.`,
                ephemeral: true
            });
        }
    } else if (interaction.customId === 'ticket_open') {
        if (interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`)) return interaction.reply({
            content: `You already have an open ticket: <#${interaction.guild.channels.cache.find(c => c.name === `ticket-${interaction.user.id}`).id}>`,
            ephemeral: true
        });

        const channel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.id}`,
            parent: interaction.channel.parent.id,
            type: Discord.ChannelType.TEXT,
            permissionOverwrites: [{
                    id: interaction.guild.id,
                    allow: ['SendMessages'],
                    deny: ['ViewChannel']
                },
                {
                    id: interaction.user.id,
                    allow: ['ViewChannel']
                },
                {
                    id: client.config.server.eventManagerRole,
                    allow: ['ViewChannel']
                }
            ]
        });

        const ticketEmbed = new Discord.EmbedBuilder()
            .setDescription('Please upload your macro here\nTo close this ticket, press the button below')
            .setColor('Blurple')

        const button = new Discord.ButtonBuilder()
            .setCustomId('ticket_close')
            .setLabel('Close')
            .setStyle(Discord.ButtonStyle.Secondary)

        const actionRow = new Discord.ActionRowBuilder()
            .addComponents(button)

        interaction.reply({
            content: `Ticket created <#${channel.id}>`,
            ephemeral: true
        });

        channel.send({
            content: `<@&${client.config.server.eventManagerRole}> <@${interaction.user.id}>`,
            embeds: [ticketEmbed],
            components: [actionRow]
        });
    } else if (interaction.customId === 'ticket_close') {
        const closeButton = new Discord.ButtonBuilder()
            .setCustomId('ticket_close_confirm')
            .setLabel('Close')
            .setStyle(Discord.ButtonStyle.Danger)

        const cancelButton = new Discord.ButtonBuilder()
            .setCustomId('ticket_close_cancel')
            .setLabel('Cancel')
            .setStyle(Discord.ButtonStyle.Secondary)

        const actionRow = new Discord.ActionRowBuilder()
            .addComponents(closeButton, cancelButton)

        interaction.channel.send({
            content: 'Are you sure?',
            components: [actionRow]
        });
    } else if (interaction.customId === 'ticket_close_confirm') {
        interaction.message.delete();

        interaction.channel.permissionOverwrites.delete(interaction.channel.name.replace('ticket-', ''));

        const embed = new Discord.EmbedBuilder()
            .setDescription("```Ticket controls```")
            .setColor('Blurple')

        const openButton = new Discord.ButtonBuilder()
            .setCustomId('ticket_reopen')
            .setLabel('Open')
            .setStyle(Discord.ButtonStyle.Secondary)

        const deleteButton = new Discord.ButtonBuilder()
            .setCustomId('ticket_delete')
            .setLabel('Delete')
            .setStyle(Discord.ButtonStyle.Secondary)

        const actionRow = new Discord.ActionRowBuilder()
            .addComponents(openButton, deleteButton)

        interaction.channel.send({
            embeds: [embed],
            components: [actionRow]
        });
    } else if (interaction.customId === 'ticket_close_cancel') {
        interaction.message.delete();
    } else if (interaction.customId === 'ticket_reopen') {
        interaction.message.delete();
        interaction.channel.permissionOverwrites.create(interaction.channel.name.replace('ticket-', ''), {
            ViewChannel: true
        });
    } else if (interaction.customId === 'ticket_delete') {
        interaction.channel.delete();
    }
}