const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { PERMISSION_LEVELS, getPermissionLevel } = require('../permissions/levels');
const { User } = require('../database/models');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Acordă un avertisment unui utilizator')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul de avertizat').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Motivul avertismentului').setRequired(true)),
    async execute(interaction) {
        const { member } = interaction;
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');

        if (getPermissionLevel(member) < PERMISSION_LEVELS.MODERATOR) {
            return interaction.reply({ content: 'Nu ai permisiunea de Moderator!', ephemeral: true });
        }

        await User.findOneAndUpdate(
            { discordId: targetUser.id },
            { $push: { warnings: { date: new Date(), reason: reason, staff: interaction.user.id } } },
            { upsert: true }
        );

        const embed = new EmbedBuilder()
            .setTitle('⚠️ UTILIZATOR AVERTIZAT')
            .setColor('#ff0000')
            .addFields(
                { name: 'Utilizator', value: `<@${targetUser.id}>` },
                { name: 'Motiv', value: reason },
                { name: 'Staff', value: `<@${interaction.user.id}>` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
