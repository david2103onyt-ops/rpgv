const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { PERMISSION_LEVELS, getPermissionLevel } = require('../permissions/levels');
const { User } = require('../database/models');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Vezi statisticile tale sau ale unui utilizator')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul de verificat')),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const userData = await User.findOne({ discordId: targetUser.id });

        if (!userData) {
            return interaction.reply({ content: 'Utilizatorul nu are date în baza de date (nu a fost în ture/sesiuni).', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle(`📊 STATISTICI RPGV | ${targetUser.username}`)
            .setColor('#2f3136')
            .addFields(
                { name: '👮 Facțiune', value: userData.faction || 'Fără facțiune', inline: true },
                { name: '🕒 Timp Total Ture', value: `${Math.round(userData.totalShiftTime)} min`, inline: true },
                { name: '🕒 Timp Total Sesiuni', value: `${Math.round(userData.totalSessionTime)} min`, inline: true },
                { name: '⚠️ Avertismente', value: `${userData.warnings.length}`, inline: true }
            )
            .setFooter({ text: 'RPGV Statistics' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
