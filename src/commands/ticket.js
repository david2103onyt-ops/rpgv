const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
const { PERMISSION_LEVELS, getPermissionLevel } = require('../permissions/levels');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Creează un ticket de suport'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎫 CENTRUL DE SUPORT RPGV')
            .setDescription('Salut! Te rugăm să selectezi categoria potrivită din meniul de mai jos pentru a primi ajutorul necesar.')
            .setColor('#2f3136')
            .setFooter({ text: 'Sistem Ticket RPGV' })
            .setTimestamp();

        const menu = new StringSelectMenuBuilder()
            .setCustomId('ticket_select')
            .setPlaceholder('Alege categoria ticketului...')
            .addOptions([
                { label: 'Problemă Sesiune', value: 'session_issue', emoji: '🎮' },
                { label: 'Aplicație Poliție', value: 'app_police', emoji: '👮' },
                { label: 'Aplicație Pompieri', value: 'app_fire', emoji: '🚒' },
                { label: 'Aplicație DOT', value: 'app_dot', emoji: '🚧' },
                { label: 'Aplicație Session Host', value: 'app_host', emoji: '🎙️' },
                { label: 'Raportare', value: 'report', emoji: '⚠️' },
                { label: 'Sugestie', value: 'suggestion', emoji: '💡' },
                { label: 'Staff', value: 'staff', emoji: '🛡️' },
                { label: 'Altă problemă', value: 'other', emoji: '❓' },
            ]);

        const row = new ActionRowBuilder().addComponents(menu);

        await interaction.reply({ embeds: [embed], components: [row] });
    }
};
