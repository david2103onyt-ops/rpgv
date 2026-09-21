const { Events } = require('discord.js');
const logger = require('../../utils/logger');
const { createEmbed, COLORS } = require('../../utils/embeds');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      // Handle slash commands
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        const cooldownLeft = interaction.client.checkCooldown(interaction.user.id, interaction.commandName);
        if (cooldownLeft > 0) {
          return interaction.reply({
            content: `Asteapta ${cooldownLeft.toFixed(1)} secunde inainte de a folosi aceasta comanda din nou.`,
            ephemeral: true,
          });
        }

        await command.execute(interaction);
      }

      // Handle buttons
      if (interaction.isButton()) {
        await handleButton(interaction);
      }

      // Handle select menus
      if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction);
      }

      // Handle modals
      if (interaction.isModalSubmit()) {
        await handleModal(interaction);
      }
    } catch (error) {
      logger.error(`Interaction error: ${error.message}`);
      const reply = {
        content: 'A aparut o eroare la executarea acestei interactiuni!',
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  },
};

async function handleButton(interaction) {
  const { customId } = interaction;

  // Ticket buttons
  if (customId.startsWith('ticket_')) {
    const ticketService = require('../services/ticketService');
    await ticketService.handleButton(interaction);
  }

  // Application buttons
  if (customId.startsWith('app_')) {
    const applicationService = require('../services/applicationService');
    await applicationService.handleButton(interaction);
  }

  // Department buttons
  if (customId.startsWith('dept_')) {
    const departmentService = require('../services/departmentService');
    await departmentService.handleButton(interaction);
  }

  // Verification buttons
  if (customId.startsWith('verify_')) {
    const verificationService = require('../services/verificationService');
    await verificationService.handleButton(interaction);
  }

  // Security buttons
  if (customId.startsWith('security_')) {
    const securityService = require('../services/securityService');
    await securityService.handleButton(interaction);
  }
}

async function handleSelectMenu(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('dept_select_')) {
    const departmentService = require('../services/departmentService');
    await departmentService.handleSelectMenu(interaction);
  }

  if (customId.startsWith('ticket_select_')) {
    const ticketService = require('../services/ticketService');
    await ticketService.handleSelectMenu(interaction);
  }
}

async function handleModal(interaction) {
  const { customId } = interaction;

  if (customId.startsWith('modal_application_')) {
    const applicationService = require('../services/applicationService');
    await applicationService.handleModal(interaction);
  }

  if (customId.startsWith('modal_ticket_')) {
    const ticketService = require('../services/ticketService');
    await ticketService.handleModal(interaction);
  }

  if (customId.startsWith('modal_verify_')) {
    const verificationService = require('../services/verificationService');
    await verificationService.handleModal(interaction);
  }
}
