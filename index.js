const Discord = require('discord.js');
const dashboard = require('./dashboard/server.js');
const db = require('./managers/database.js');

const botConfig = require('./config/bot.js');
const idConfig = require('./config/ids.js');
const linkConfig = require('./config/links.js');

const client = new Discord.Client({
    intents: Object.keys(Discord.GatewayIntentBits).map((intent) => Discord.GatewayIntentBits[intent]),
});

client.commands = new Discord.Collection();
client.config = { ...botConfig, ...idConfig, ...linkConfig };
client.preLoginLogQueue = [];

if (botConfig.sendLogs == true) {
    const originalConsoleLog = console.log;

    console.log = function (message) {
        client.preLoginLogQueue.push(message);
        originalConsoleLog(message);
    }
}

["commands", "events"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});

dashboard(client);
db.connect();
client.login(botConfig.token);

process.on("uncaughtException", (error) => {
    console.error(error.stack); 
});

process.on("unhandledRejection", (error) => {
    if (error.stack) console.log(error.stack);
    else console.log(error);
});