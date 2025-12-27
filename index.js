const Discord = require('discord.js');
const server = require('./dashboard/server.js');
const db = require('./managers/database.js');
const config = require('./config.js');

const client = new Discord.Client({
    intents: Object.keys(Discord.GatewayIntentBits).map((intent) => Discord.GatewayIntentBits[intent]),
});

client.commands = new Discord.Collection();
client.config = config;
client.preLoginLogQueue = [];

if (config.sendLogs == true) {
    const originalConsoleLog = console.log;

    console.log = function (message) {
        client.preLoginLogQueue.push(message);
        originalConsoleLog(message);
    }
}

["commands", "events"].forEach(handler => {
    require(`./handlers/${handler}`)(client);
});

server.run(client);
db.connect();
client.login(config.token);

process.on("uncaughtException", (error) => {
    console.log(error.stack); 
});

process.on("unhandledRejection", (error) => {
    if (error.stack) console.log(error.stack);
    else console.log(error);
});