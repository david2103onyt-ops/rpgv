const { PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const Ticket = require('../../database/models/Ticket');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createSelectMenu, createModal, TextInputBuilder, TextInputStyle } = require('../../utils/embeds');
const { generateId } = require('../../utils/permissions');
const config = require('../../config');

const TIER_CONFIG = {
  1: {
    name: 'Tier 1 - Basic',
    color: '#00FF00',
    emoji: '🟢',
    description: 'Suport general, intrebari simple',
    responseTime: '24 ore',
    staffRequired: ['Helper', 'Moderator'],
    priority: 'low',
  },
  2: {
    name: 'Tier 2 - Advanced',
    color: '#FFA500',
    emoji: '🟡',
    description: 'Probleme complexe, rapoarte, dispute',
    responseTime: '12 ore',
    staffRequired: ['Moderator', 'Admin'],
    priority: 'medium',
  },
  3: {
    name: 'Tier 3 - Critical',
    color: '#FF0000',
    emoji: '🔴',
    description: 'Probleme urgente, abuzuri grave, appeal-uri ban',
    responseTime: '4 ore',
    staffRequired: ['Admin', 'Founder'],
    priority: 'high',
  },
};

class TicketService {
  static async createTicket(interaction, category, tier, reason) {
    try {
      const guild = interaction.guild;
      const member = interaction.member;

      const tierConfig = TIER_CONFIG[tier] || TIER_CONFIG[1];

      // Check if user already has an open ticket
      const existingTicket = await Ticket.findOne({
        guildId: guild.id,
        creatorId: member.id,
        status: { $in: ['open', 'claimed'] },
      });

      if (existingTicket) {
        return interaction.reply({
          content: 'Ai deja un ticket deschis! Inchide-l pe cel existent inainte de a deschide unul nou.',
          ephemeral: true,
        });
      }

      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${tier}-${member.user.username}`,
        type: ChannelType.GuildText,
        parent: config.tickets.category,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
          ...config.tickets.staffRoles.map(roleId => ({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages,
            ],
          })),
        ],
      });

      // Save ticket to database
      const ticket = await Ticket.create({
        guildId: guild.id,
        channelId: ticketChannel.id,
        creatorId: member.id,
        category,
        tier,
        priority: tierConfig.priority,
        status: 'open',
      });

      // Create ticket embed
      const embed = createEmbed({
        title: `${tierConfig.emoji} Ticket ${tierConfig.name}`,
        description: `Bine ai venit ${member}!\n\n**Motiv:** ${reason}\n\n**Ticket ID:** ${ticket._id}\n**Tier:** ${tierConfig.emoji} ${tierConfig.name}\n**Creat:** <t:${Math.floor(Date.now() / 1000)}:R>\n**Timp estimat de raspuns:** ${tierConfig.responseTime}\n\nUn staff member te va ajuta in curand!`,
        color: tierConfig.color,
        fields: [
          { name: '📋 Categorie', value: category, inline: true },
          { name: '⚡ Tier', value: `${tierConfig.emoji} Tier ${tier}`, inline: true },
          { name: '📊 Status', value: 'Open', inline: true },
          { name: '⏰ Raspuns estimat', value: tierConfig.responseTime, inline: true },
        ],
        footer: { text: 'Greenville RP - Ticket System' },
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'ticket_claim', label: 'Preia Ticket', style: ButtonStyle.Success, emoji: '✋' }),
        createButton({ customId: 'ticket_close', label: 'Inchide Ticket', style: ButtonStyle.Danger, emoji: '🔒' }),
        createButton({ customId: 'ticket_priority', label: 'Prioritate', style: ButtonStyle.Secondary, emoji: '⚡' }),
      ]);

      await ticketChannel.send({ embeds: [embed], components: [buttons] });

      // Log
      logger.info(`Ticket created: ${ticket._id} by ${member.user.tag} - Tier ${tier}`);

      return interaction.reply({
        content: `Ticket creat cu succes! ${ticketChannel}\n\n**Tier:** ${tierConfig.emoji} ${tierConfig.name}\n**Timp estimat:** ${tierConfig.responseTime}`,
        ephemeral: true,
      });
    } catch (error) {
      logger.error(`Failed to create ticket: ${error.message}`);
      return interaction.reply({
        content: 'A aparut o eroare la crearea ticketului!',
        ephemeral: true,
      });
    }
  }

  static async showTierSelection(interaction) {
    try {
      const embed = createEmbed({
        title: '🎫 Selecteaza Tier-ul Ticketului',
        description: 'Alege tier-ul potrivit pentru problema ta:\n\n**🟢 Tier 1 - Basic**\nSuport general, intrebari simple despre joc/server\n\n**🟡 Tier 2 - Advanced**\nProbleme complexe, rapoarte despre jucatori, dispute\n\n**🔴 Tier 3 - Critical**\nProbleme urgente, abuzuri grave, appeal-uri ban\n\n⚠️ **Atentie:** Folosirea tier-ului gresit poate intarzia rezolvarea problemei!',
        color: COLORS.primary,
        fields: [
          { name: '🟢 Tier 1', value: 'Raspuns in ~24h', inline: true },
          { name: '🟡 Tier 2', value: 'Raspuns in ~12h', inline: true },
          { name: '🔴 Tier 3', value: 'Raspuns in ~4h', inline: true },
        ],
        timestamp: true,
      });

      const selectMenu = createSelectMenu({
        customId: 'ticket_select_tier',
        placeholder: 'Selecteaza tier-ul...',
        options: [
          { 
            label: 'Tier 1 - Basic', 
            value: '1', 
            emoji: '🟢', 
            description: 'Suport general, intrebari simple' 
          },
          { 
            label: 'Tier 2 - Advanced', 
            value: '2', 
            emoji: '🟡', 
            description: 'Probleme complexe, rapoarte' 
          },
          { 
            label: 'Tier 3 - Critical', 
            value: '3', 
            emoji: '🔴', 
            description: 'Probleme urgente, abuzuri grave' 
          },
        ],
      });

      const buttons = createActionRow([
        createButton({ customId: 'ticket_cancel', label: 'Anuleaza', style: ButtonStyle.Secondary, emoji: '❌' }),
      ]);

      await interaction.reply({ embeds: [embed], components: [selectMenu, buttons], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to show tier selection: ${error.message}`);
    }
  }

  static async showCategorySelection(interaction, tier) {
    try {
      const tierConfig = TIER_CONFIG[tier];

      const embed = createEmbed({
        title: `${tierConfig.emoji} Selecteaza Categoria - ${tierConfig.name}`,
        description: `Ai selectat **Tier ${tier}**.\n\nAcum selecteaza categoria problemei tale:`,
        color: tierConfig.color,
        timestamp: true,
      });

      const selectMenu = createSelectMenu({
        customId: `ticket_select_category_${tier}`,
        placeholder: 'Selecteaza categoria...',
        options: [
          { label: 'Support', value: 'support', emoji: '🎯', description: 'Intrebari generale si suport' },
          { label: 'Report', value: 'report', emoji: '📋', description: 'Raporteaza un jucator' },
          { label: 'Department', value: 'department', emoji: '🏛️', description: 'Intrebari despre departamente' },
          { label: 'Appeal', value: 'appeal', emoji: '⚖️', description: 'Contestatii si appeal-uri' },
          { label: 'Other', value: 'other', emoji: '❓', description: 'Alte probleme' },
        ],
      });

      const buttons = createActionRow([
        createButton({ customId: 'ticket_back_tier', label: 'Inapoi', style: ButtonStyle.Secondary, emoji: '⬅️' }),
        createButton({ customId: 'ticket_cancel', label: 'Anuleaza', style: ButtonStyle.Secondary, emoji: '❌' }),
      ]);

      await interaction.update({ embeds: [embed], components: [selectMenu, buttons] });
    } catch (error) {
      logger.error(`Failed to show category selection: ${error.message}`);
    }
  }

  static async showReasonModal(interaction, tier, category) {
    try {
      const tierConfig = TIER_CONFIG[tier];

      const modal = createModal({
        customId: `modal_ticket_${tier}_${category}`,
        title: `Ticket ${tierConfig.name} - ${category}`,
        components: [
          [
            {
              customId: 'reason',
              label: 'Descrie problema ta',
              style: TextInputStyle.Paragraph,
              placeholder: 'Explica cat mai detaliat problema pe care o intampini...',
              required: true,
              minLength: 20,
              maxLength: 1000,
            },
          ],
          [
            {
              customId: 'evidence',
              label: 'Dovezi (optional)',
              style: TextInputStyle.Paragraph,
              placeholder: 'Link-uri, screenshot-uri, etc.',
              required: false,
              maxLength: 500,
            },
          ],
        ],
      });

      await interaction.showModal(modal);

      // Wait for modal submission
      const filter = (i) => i.customId === `modal_ticket_${tier}_${category}` && i.user.id === interaction.user.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 120000 });

      const reason = modalInteraction.fields.getTextInputValue('reason');
      const evidence = modalInteraction.fields.getTextInputValue('evidence') || null;

      // Create ticket
      await this.createTicket(modalInteraction, category, tier, reason);
    } catch (error) {
      logger.error(`Failed to show reason modal: ${error.message}`);
    }
  }

  static async handleButton(interaction) {
    const { customId } = interaction;
    const ticket = await Ticket.findOne({ channelId: interaction.channel.id });

    if (customId === 'ticket_new') {
      await this.showTierSelection(interaction);
      return;
    }

    if (customId === 'ticket_back_tier') {
      await this.showTierSelection(interaction);
      return;
    }

    if (customId === 'ticket_cancel') {
      await interaction.update({ content: '❌ Ticket anulat.', embeds: [], components: [] });
      return;
    }

    if (!ticket) {
      if (customId.startsWith('ticket_')) {
        return interaction.reply({
          content: 'Acest ticket nu exista in baza de date!',
          ephemeral: true,
        });
      }
      return;
    }

    switch (customId) {
      case 'ticket_claim':
        await this.claimTicket(interaction, ticket);
        break;
      case 'ticket_close':
        await this.closeTicket(interaction, ticket);
        break;
      case 'ticket_priority':
        await this.showPriorityMenu(interaction, ticket);
        break;
      case 'ticket_low':
        await this.setPriority(interaction, ticket, 'low');
        break;
      case 'ticket_medium':
        await this.setPriority(interaction, ticket, 'medium');
        break;
      case 'ticket_high':
        await this.setPriority(interaction, ticket, 'high');
        break;
      case 'ticket_critical':
        await this.setPriority(interaction, ticket, 'critical');
        break;
      case 'ticket_transcript':
        await this.generateTranscript(interaction, ticket);
        break;
    }
  }

  static async handleSelectMenu(interaction) {
    const { customId, values } = interaction;

    if (customId === 'ticket_select_tier') {
      const tier = parseInt(values[0]);
      await this.showCategorySelection(interaction, tier);
    }

    if (customId.startsWith('ticket_select_category_')) {
      const tier = parseInt(customId.split('_')[3]);
      const category = values[0];
      await this.showReasonModal(interaction, tier, category);
    }
  }

  static async claimTicket(interaction, ticket) {
    try {
      if (!interaction.member.roles.cache.some(r => config.tickets.staffRoles.includes(r.id))) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a prelua tickete!',
          ephemeral: true,
        });
      }

      ticket.claimedBy = interaction.member.id;
      ticket.status = 'claimed';
      await ticket.save();

      const tierConfig = TIER_CONFIG[ticket.tier] || TIER_CONFIG[1];

      const embed = createEmbed({
        title: `${tierConfig.emoji} Ticket Preluat`,
        description: `Ticketul a fost preluat de ${interaction.member}!`,
        color: tierConfig.color,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
      logger.info(`Ticket ${ticket._id} claimed by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to claim ticket: ${error.message}`);
    }
  }

  static async closeTicket(interaction, ticket) {
    try {
      ticket.status = 'closed';
      ticket.closedBy = interaction.member.id;
      ticket.closedAt = new Date();
      await ticket.save();

      const tierConfig = TIER_CONFIG[ticket.tier] || TIER_CONFIG[1];

      const embed = createEmbed({
        title: '🔒 Ticket Inchis',
        description: `Ticketul a fost inchis de ${interaction.member}!\n\n**Tier:** ${tierConfig.emoji} ${tierConfig.name}\nTicketul va fi sters in 10 secunde...`,
        color: COLORS.danger,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });

      // Generate transcript before deleting
      await this.generateTranscript(interaction, ticket);

      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (error) {
          logger.error(`Failed to delete ticket channel: ${error.message}`);
        }
      }, 10000);

      logger.info(`Ticket ${ticket._id} closed by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to close ticket: ${error.message}`);
    }
  }

  static async showPriorityMenu(interaction, ticket) {
    try {
      const row = createActionRow([
        createButton({ customId: 'ticket_low', label: 'Low', style: ButtonStyle.Secondary }),
        createButton({ customId: 'ticket_medium', label: 'Medium', style: ButtonStyle.Primary }),
        createButton({ customId: 'ticket_high', label: 'High', style: ButtonStyle.Warning }),
        createButton({ customId: 'ticket_critical', label: 'Critical', style: ButtonStyle.Danger }),
      ]);

      await interaction.reply({ components: [row], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to show priority menu: ${error.message}`);
    }
  }

  static async setPriority(interaction, ticket, priority) {
    try {
      ticket.priority = priority;
      await ticket.save();

      const priorityColors = {
        low: COLORS.info,
        medium: COLORS.primary,
        high: COLORS.warning,
        critical: COLORS.danger,
      };

      const embed = createEmbed({
        title: '⚡ Prioritate Setata',
        description: `Prioritatea a fost setata la **${priority.toUpperCase()}**!`,
        color: priorityColors[priority],
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to set priority: ${error.message}`);
    }
  }

  static async generateTranscript(interaction, ticket) {
    try {
      const messages = await interaction.channel.messages.fetch();
      let transcript = `=== TICKET TRANSCRIPT ===\n`;
      transcript += `Ticket ID: ${ticket._id}\n`;
      transcript += `Category: ${ticket.category}\n`;
      transcript += `Tier: ${ticket.tier}\n`;
      transcript += `Creator: <@${ticket.creatorId}>\n`;
      transcript += `Created: ${ticket.createdAt}\n`;
      transcript += `Closed: ${ticket.closedAt || 'N/A'}\n`;
      transcript += `================================\n\n`;

      messages.reverse().forEach(msg => {
        transcript += `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content}\n`;
      });

      ticket.transcript = transcript;
      await ticket.save();

      return transcript;
    } catch (error) {
      logger.error(`Failed to generate transcript: ${error.message}`);
      return null;
    }
  }

  static async handleModal(interaction) {
    // Handle modal submissions for ticket reasons
  }
}

module.exports = TicketService;
