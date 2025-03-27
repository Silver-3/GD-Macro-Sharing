const Discord = require('discord.js');
const config = require('./config.json');
const dashboard = require('./dashboard/server.js');

const client = new Discord.Client({
    intents: Object.keys(Discord.GatewayIntentBits).map((intent) => Discord.GatewayIntentBits[intent]),
});

client.commands = new Discord.Collection();
client.config = config;
client.preLoginLogQueue = [];
client.fakeWebhook = require('./managers/fakeWebhook.js');

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

dashboard(client);
client.login(config.token);

process.on("uncaughtException", (err) => {
    console.log("[ERROR] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.log("[ERROR] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("SIGINT", () => {
    console.log("[ERROR] Caught SIGINT, preventing shutdown...");
});

process.on("SIGTERM", () => {
    console.log("[ERROR] Caught SIGTERM, preventing shutdown...");
});