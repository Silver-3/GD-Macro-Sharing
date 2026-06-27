const Discord = require('discord.js');
const Tesseract = require('tesseract.js');
const https = require('https');

const SCAM_DOMAINS  = ['kasowin.com', 'serowin.com', 'kasowin', 'serowin'];
const SCAM_PHRASES  = [
    'promo code', 'claim your reward', 'withdrawal success',
    'crypto casino', 'was successfully', 'receive your',
    'bonus immediately', 'enter the special', 'vyro project',
    'activate code', 'rakeback', 'vip-club'
];

/**
 * Downloads an image from a URL using built-in https and returns a Buffer
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
async function fetchImageBuffer(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
}

/**
 * Downloads a Discord image attachment and runs OCR on it
 * Returns extracted text, or empty string on failure
 * @param {string} url
 * @returns {Promise<string>}
 */
async function extractTextFromImage(url) {
    try {
        const buffer = await fetchImageBuffer(url);
        const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
        return text.toLowerCase();
    } catch (err) {
        console.log(`[ERROR] OCR failed: ${err}`);
        return '';
    }
}

/**
 * Scans all image attachments in a message for scam text via OCR
 * @param {Discord.Message} message
 * @returns {Promise<{ detected: boolean, reason: string | null }>}
 */
async function scanImagesForScam(message) {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    const imageAttachments = [...message.attachments.values()].filter(a =>
        supportedTypes.includes(a.contentType?.split(';')[0].trim())
    );

    if (!imageAttachments.length) return { detected: false, reason: null };

    const results = await Promise.allSettled(
        imageAttachments.map(a => extractTextFromImage(a.url))
    );

    for (const result of results) {
        if (result.status !== 'fulfilled' || !result.value) continue;

        const text = result.value;

        const matchedDomain = SCAM_DOMAINS.find(d => text.includes(d));
        const matchedPhrase = SCAM_PHRASES.find(p => text.includes(p));

        if (matchedDomain || matchedPhrase) {
            return {
                detected: true,
                reason: `Matched: "${matchedDomain || matchedPhrase}"`
            };
        }
    }

    return { detected: false, reason: null };
}

module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     * @param {Discord.Message} message
     * @param {Discord.Client} client
     */
    run: async (message, client) => {
        if (!message.guild || message.author.bot) return;

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = message.content.match(urlRegex);

        let scamImageDetected = false;
        let scamImageReason   = null;

        if (message.attachments?.size > 2) {
            try {
                const scan = await scanImagesForScam(message);
                scamImageDetected = scan.detected;
                scamImageReason   = scan.reason;
            } catch (error) {
                console.log(`[ERROR] Scam image scan failed: ${error}`);
            }
        }

        if (scamImageDetected) {
            const member = message.member;
            if (member.roles.cache.has(client.config.roles.img)) return;

            try {
                await message.delete();

                try {
                    await member.timeout(10 * 60 * 1000, "Possible scam");
                } catch (error) {
                    console.log(`[ERROR] Failed to time out member: ${error}`);
                }

                let loggedContent = message.content || "";

                if (message.attachments?.size > 0) {
                    const attachmentNames = message.attachments.map(a => `📎 [Attachment: ${a.name}]`).join('\n');
                    loggedContent = loggedContent ? `${loggedContent}\n\n${attachmentNames}` : attachmentNames;
                }

                if (loggedContent.length > 4096) {
                    loggedContent = loggedContent.substring(0, 4093) + "...";
                }

                const channel = await message.guild.channels.fetch(client.config.channels.automod);
                const automodEmbed = new Discord.EmbedBuilder()
                    .setAuthor({
                        name: member.user.username,
                        iconURL: member.displayAvatarURL()
                    })
                    .setDescription(loggedContent)
                    .setFooter({ text: "Scam image detected" });

                channel.send({
                    content: `Blocked a message in <#${message.channel.id}>`,
                    embeds: [automodEmbed]
                });
            } catch (error) {
                console.log(`[ERROR] Error in scam automod\n${error}`);
            }
        }

        if (message.reference && message.content.toLowerCase() === 'timeout') {
            if (message.author.id !== client.config.devId) return;

            try {
                const referencedMessage = await message.fetchReference();
                const member = referencedMessage.member;

                if (!member || !referencedMessage) return;

                await member.timeout(60 * 60 * 1000, `Timeout by ${message.author.tag}`);

                for (const channelId of client.config.channels.chats) {
                    try {
                        const channel = await message.guild.channels.fetch(channelId);
                        if (!channel || !channel.isTextBased()) continue;

                        const msgs = await channel.messages.fetch({ limit: 50 });
                        const toDelete = msgs.filter(m => m.author.id === member.id);

                        if (toDelete.size > 0) {
                            await channel.bulkDelete(toDelete);
                        }
                    } catch (err) {
                        continue;
                    }
                }

                if (!message.deleted) await message.delete();
            } catch (error) {
                console.error(`[ERROR] Global timeout failed: ${error}`);
            }
            return;
        }

        if (message.author.id !== client.config.devId) return;

        if (message.content.includes('eval')) {
            const codeButton = new Discord.ButtonBuilder()
                .setCustomId('code_eval')
                .setLabel('Submit Code')
                .setStyle(Discord.ButtonStyle.Primary);

            const codeActionRow = new Discord.ActionRowBuilder()
                .addComponents(codeButton);

            message.delete();
            message.channel.send({ components: [codeActionRow] });
        }
    }
}