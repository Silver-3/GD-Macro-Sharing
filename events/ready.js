const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'ready',
    once: false,
    /**
     * @param {Discord.Client} client 
     */
    run: async (client) => {
        let logMsg;

        const logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir);
        }

        const logFileName = `log-${new Date().toISOString().slice(0, 10)}.txt`;
        const logFilePath = path.join(logsDir, logFileName);

        fs.appendFileSync(logFilePath, `--- Log Start: ${new Date().toISOString()} ---\n`);

        if (client.config.sendLogs == true) {
            const originalConsoleLog = console.log;

            const user = await client.users.fetch(client.config.devId);
            const dmChannel = await user.createDM();

            const messages = await dmChannel.messages.fetch({
                limit: 100
            });
            const botMessages = messages.filter(msg => msg.author.id === client.user.id);
            botMessages.forEach(msg => msg.delete());

            logMsg = await dmChannel.send("```Bot Uptime: 0s\n\nBot Logs:```");
            let startTime = Date.now();
            let logQueue = [];
            let isProcessingQueue = false;

            function getFormattedUptime() {
                let uptime = Date.now() - startTime;

                let seconds = Math.floor((uptime / 1000) % 60);
                let minutes = Math.floor((uptime / (1000 * 60)) % 60);
                let hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
                let days = Math.floor(uptime / (1000 * 60 * 60 * 24));

                let formattedUptime = [];

                if (days > 0) formattedUptime.push(`${days}d`);
                if (hours > 0 || days > 0) formattedUptime.push(`${hours}h`);
                if (minutes > 0 || hours > 0 || days > 0) formattedUptime.push(`${minutes}m`);
                formattedUptime.push(`${seconds}s`);

                return formattedUptime.join(' ');
            }

            async function processLogQueue() {
                if (isProcessingQueue || logQueue.length === 0) return;
                isProcessingQueue = true;

                let currentLogs = logMsg.content.match(/Bot Logs:\n([\s\S]*)```/);
                let updatedLogs = (currentLogs ? currentLogs[1] : '');

                while (logQueue.length > 0) {
                    let logEntry = logQueue.shift();
                    updatedLogs += logEntry + '\n';

                    if (updatedLogs.length > 1900) {
                        logMsg = await dmChannel.send("```Bot Uptime: " + getFormattedUptime() + "\n\nBot Logs:\n" + logEntry + "```");
                        updatedLogs = '';
                    } else {
                        await logMsg.edit("```Bot Uptime: " + getFormattedUptime() + "\n\nBot Logs:\n" + updatedLogs + "```");
                    }

                    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${logEntry}\n`);
                }

                isProcessingQueue = false;
            }

            client.preLoginLogQueue.forEach(log => logQueue.push(log));
            processLogQueue();

            console.log = function (message) {
                originalConsoleLog(message);
                logQueue.push(message);
                processLogQueue();

                fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
            };
        }

        console.log(`[BOT] Bot is online.`);
        client.user.setActivity(`over ${client.guilds.cache.get(client.config.server.serverId).name}`, {
            type: Discord.ActivityType.Watching
        });

        async function loadCommands() {
            const guilds = client.guilds.cache.map(guild => guild);
            const loadPromises = guilds.map(guild => require('../handlers/commands').load(client, guild.id));
            await Promise.all(loadPromises);
        }

        loadCommands().then(() => {
            console.log(`[INFO] Slash Commands have loaded.`);
        });

        if (client.config.sendLogs == true) {
            setInterval(() => {
                logMsg.edit(logMsg.content.replace(/Bot Uptime: [\s\S]*?\n/, "Bot Uptime: " + getFormattedUptime() + "\n"));
            }, 10000);
        }
    }
}