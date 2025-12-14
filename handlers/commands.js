const Discord = require('discord.js');
const fs = require('fs');

const commands = [];

module.exports = async (client) => {
    const commandFiles = fs.readdirSync(`./commands/`).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);

        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        console.log(`[COMMAND] ${command.data.name} has loaded`);
    }

    console.log("[INFO] Commands have loaded.");
}

module.exports.load = async (client, guildId) => {
    const clientId = client.user?.id;
  
    const rest = new Discord.REST({
      version: '9'
    }).setToken(client.config.token);
  
    try {
      await rest.put(
        Discord.Routes.applicationGuildCommands(clientId, guildId), {
          body: commands
        },
      ); 
      console.log(`[SLASH-COMMANDS] registered ${commands.length} commands in ${client.guilds.cache.get(guildId).name} (${guildId})`);
    } catch (error) {
      console.error(error);
    }
  };