const Discord = require('discord.js');
const util = require('util');
const fs = require('fs');

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
    }
}