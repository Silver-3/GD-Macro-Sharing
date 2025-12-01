const Discord = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    once: false,
    /**
     * @param {Discord.Client} client 
     * @param {Discord.Interaction} interaction
     */
    run: async (interaction, client) => {
        if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                command.autocomplete(interaction, client)
            } catch (error) {
                console.log(error);
            }
        }

        if (interaction.isButton()) return require('../managers/buttonManager.js')(interaction, client);
        if (interaction.isModalSubmit()) return require('../managers/modalManager.js')(interaction, client);
        if (!interaction.isCommand()) return;

        const commandName = interaction.commandName;

        const command = client.commands.get(commandName);
        if (!command) return;

        try {
            command.run(interaction, client);
        } catch (error) {
            const fileName = path.basename(__filename);
            console.log(`${error.name}\noccurred: ${fileName} in function command.run\n${error.stack}`);
        }
    }
}