const Discord = require('discord.js');

/**
 * @param {Discord.Interaction} interaction
 * @param {Discord.Client} client
 */

module.exports = async (interaction, client) => {
    if (interaction.customId === 'search') {
        const SearchModal = new Discord.ModalBuilder()
            .setCustomId('search_modal_' + interaction.values[0])
            .setTitle('Search for macro')

        const SearchInput = new Discord.TextInputBuilder()
            .setCustomId('search_modal_input')
            .setLabel('Insert name of level to search for')
            .setStyle(Discord.TextInputStyle.Short)

        const SearchInputActionRow = new Discord.ActionRowBuilder()
           .addComponents(SearchInput)

        SearchModal.addComponents(SearchInputActionRow);

        await interaction.showModal(SearchModal);
    }
}