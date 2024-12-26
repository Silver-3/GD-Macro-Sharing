const Discord = require('discord.js');
const util = require('util');
const path = require('path');
const fs = require('fs');

const macrosFilePath = path.resolve(__dirname, '../macros.json');

/**
 * @param {Discord.Interaction} interaction
 * @param {Discord.Client} client
 */

module.exports = async (interaction, client) => {
    if (interaction.customId === 'modal_eval') {
        const codeInput = interaction.fields.getTextInputValue('code_modal_eval');
        const name = interaction.user.globalName || interaction.user.username;

        const deleteButton = new Discord.ButtonBuilder()
            .setCustomId('delete_eval')
            .setLabel('Delete')
            .setStyle(Discord.ButtonStyle.Danger)

        const deleteActionRow = new Discord.ActionRowBuilder()
            .addComponents(deleteButton)

        try {
            let output = await util.inspect((await eval(codeInput)));

            if (output.includes(client.config.token)) output = output.replace(client.config.token, '[REDACTED]');

            if (codeInput.length > 1024) code = "Code has over 1024 characters.";

            if (output.length > 1024) {
                const embed = new Discord.EmbedBuilder()
                    .setTitle('Evaluation')
                    .setColor('Blurple')
                    .addFields(
                        [{
                                name: 'Code',
                                value: "```js\n" + codeInput + "```"
                            },
                            {
                                name: 'Output',
                                value: "```sh\n" + "Output is over embed character limit. Adding output as an attachment." + "```"
                            }
                        ])
                    .setAuthor({
                        name: name,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setFooter({
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL()
                    })


                fs.writeFileSync('./output.sh', output);

                await interaction.reply({
                    components: [deleteActionRow],
                    embeds: [embed],
                    files: [{
                        attachment: './output.sh',
                        name: 'output.sh'
                    }]
                });

                setTimeout(() => {
                    fs.unlinkSync('./output.sh', function (error) {
                        if (error) return console.log(error);
                    });
                }, 1000);
            } else {
                const embed = new Discord.EmbedBuilder()
                    .setTitle('Evaluation')
                    .setColor('Blurple')
                    .addFields(
                        [{
                                name: 'Code',
                                value: "```js\n" + codeInput + "```"
                            },
                            {
                                name: 'Output',
                                value: "```sh\n" + output + "```"
                            }
                        ])
                    .setAuthor({
                        name: name,
                        iconURL: interaction.user.displayAvatarURL()
                    })
                    .setFooter({
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL()
                    })

                await interaction.reply({
                    components: [deleteActionRow],
                    embeds: [embed]
                });
            }
        } catch (error) {
            if (error == "Error: Received one or more errors") return;

            const embed = new Discord.EmbedBuilder()
                .addFields({
                    name: 'Code',
                    value: "```js\n" + codeInput + "```"
                }, {
                    name: 'Error',
                    value: "```sh\n" + error + "```"
                })
                .setColor('Blurple')
                .setAuthor({
                    name: name,
                    iconURL: interaction.user.displayAvatarURL({
                        dynamic: true
                    })
                })
                .setFooter({
                    text: interaction.guild.name,
                    iconURL: interaction.guild.iconURL()
                })

            await interaction.reply({
                embeds: [embed],
                components: [deleteActionRow],
            });
        }
    } else if (interaction.customId.startsWith('search_modal')) {
        const levelName = interaction.fields.getTextInputValue('search_modal_input');
        const macroType = interaction.customId.replace('search_modal_', '');
        let macros = JSON.parse(fs.readFileSync(macrosFilePath, 'utf8')).stored[macroType];

        if (!macros) macros = [];
        const fullNameMatches = [];
        const partialMatches = {};

        macros.forEach(macro => {
            if (macro.name.replaceAll('_', ' ').toLowerCase() == levelName.toLowerCase()) {
                fullNameMatches.push(macro);
            } else {
                levelName.split(' ').forEach(word => {
                    if (macro.name.toLowerCase().includes(word.toLowerCase())) {
                        if (!partialMatches[word]) partialMatches[word] = [];
                        partialMatches[word].push(macro);
                    }
                })
            }
        });

        let message = "";

        if (fullNameMatches.length > 0) {
            message += `Macros matching \`${levelName}\`:\n\n${fullNameMatches.map(macro => `<#${macro.channelId}>`).join('\n')}\n\n`;
        }

        levelName.split(' ').forEach(word => {
            if (partialMatches[word] && partialMatches[word].length > 0) {
                message += `Macros matching \`${word}\`:\n\n${partialMatches[word].map(macro => `<#${macro.channelId}>`).join('\n')}\n\n`;
            }
        });

        if (!message) {
            message = `No macros found matching \`${levelName}\` in the \`${macroType}\` macros.`;
        }

        const embed = new Discord.EmbedBuilder()
            .setDescription(message)
            .setColor('Blurple')
            .setTitle('Search Results')

        interaction.message.edit({
            embeds: [interaction.message.embeds[0]],
            components: [interaction.message.components[0]],
        });

        interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    }
}