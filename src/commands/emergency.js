const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('112')
        .setDescription('Trimite o alertă de urgență la dispecerat'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('modal_112')
            .setTitle('📞 DISPECERAT 112');

        const typeInput = new TextInputBuilder()
            .setCustomId('urgency_type')
            .setLabel("🚨 Tipul urgenței")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const locationInput = new TextInputBuilder()
            .setCustomId('location')
            .setLabel("📍 Locația")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const detailInput = new TextInputBuilder()
            .setCustomId('details')
            .setLabel("📝 Descrierea")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(typeInput),
            new ActionRowBuilder().addComponents(locationInput),
            new ActionRowBuilder().addComponents(detailInput)
        );

        await interaction.showModal(modal);
    }
};
