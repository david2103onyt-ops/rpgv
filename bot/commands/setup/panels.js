const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../../utils/logger');
const PanelService = require('../../../services/panelService');
const { createEmbed, COLORS } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panels')
    .setDescription('Creaza panourile interactive pe server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a folosi aceasta comanda!',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const guild = interaction.guild;

      // Create panels
      const ticketChannel = guild.channels.cache.find(c => c.name.includes('deschide-ticket'));
      if (ticketChannel) {
        await PanelService.createTicketPanel(ticketChannel);
      }

      const deptChannel = guild.channels.cache.find(c => c.name.includes('organizare-departamente'));
      if (deptChannel) {
        await PanelService.createDepartmentPanel(deptChannel);
      }

      const rulesChannel = guild.channels.cache.find(c => c.name.includes('regulament'));
      if (rulesChannel) {
        await PanelService.createRulesPanel(rulesChannel);
      }

      const verifyChannel = guild.channels.cache.find(c => c.name.includes('verificare'));
      if (verifyChannel) {
        await PanelService.createVerificationPanel(verifyChannel);
      }

      const securityChannel = guild.channels.cache.find(c => c.name.includes('securitate'));
      if (securityChannel) {
        await PanelService.createSecurityPanel(securityChannel);
      }

      const rolesChannel = guild.channels.cache.find(c => c.name.includes('general') && c.type === 0);
      if (rolesChannel) {
        await PanelService.createRolesPanel(rolesChannel);
      }

      const staffChannel = guild.channels.cache.find(c => c.name.includes('staff-chat'));
      if (staffChannel) {
        await PanelService.createStaffDashboard(staffChannel);
      }

      const successEmbed = createEmbed({
        title: '✅ Panouri Create!',
        description: 'Toate panourile interactive au fost create cu succes!\n\n**Panouri create:**\n• 🎫 Ticket System\n• 🏛️ Departamente\n• 📋 Regulament\n• ✅ Verificare\n• 🔒 Securitate\n• 🎨 Roluri\n• 👑 Staff Dashboard',
        color: COLORS.success,
        timestamp: true,
      });

      await interaction.editReply({ embeds: [successEmbed] });

      logger.info(`Panels created for ${guild.name} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Panels error: ${error.message}`);
      await interaction.editReply({
        content: `A aparut o eroare: ${error.message}`,
      });
    }
  },
};
