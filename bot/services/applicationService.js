const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const Application = require('../../database/models/Application');
const User = require('../../database/models/User');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createSelectMenu, createModal } = require('../../utils/embeds');
const config = require('../../config');

class ApplicationService {
  static async createApplication(interaction, department) {
    try {
      const guild = interaction.guild;
      const member = interaction.member;

      // Check if user already has a pending application
      const existingApp = await Application.findOne({
        guildId: guild.id,
        userId: member.id,
        department,
        status: { $in: ['pending', 'reviewing'] },
      });

      if (existingApp) {
        return interaction.reply({
          content: 'Ai deja o aplicatie pending pentru acest departament!',
          ephemeral: true,
        });
      }

      // Check if user is already in the department
      let user = await User.findOne({ userId: member.id, guildId: guild.id });
      if (user && user.departments[department]?.active) {
        return interaction.reply({
          content: 'Esti deja membru al acestui departament!',
          ephemeral: true,
        });
      }

      // Show application modal
      const modal = createModal({
        customId: `modal_application_${department}`,
        title: `Aplicatie ${config.greenville.departments[department].name}`,
        components: [
          [
            {
              customId: 'experience',
              label: 'Experienta ta in roleplay',
              style: TextInputStyle.Paragraph,
              placeholder: 'Descrie experienta ta anterioara in roleplay...',
              required: true,
              minLength: 50,
              maxLength: 1000,
            },
          ],
          [
            {
              customId: 'motivation',
              label: 'De ce vrei sa te alaturi?',
              style: TextInputStyle.Paragraph,
              placeholder: 'Spune-ne de ce vrei sa te alaturi departamentului...',
              required: true,
              minLength: 50,
              maxLength: 1000,
            },
          ],
          [
            {
              customId: 'availability',
              label: 'Disponibilitatea ta (ore/zi)',
              style: TextInputStyle.Short,
              placeholder: 'Ex: 3-4 ore pe zi, intre 18:00-22:00',
              required: true,
              maxLength: 200,
            },
          ],
          [
            {
              customId: 'scenarios',
              label: 'Cum reactionezi in situatii dificile?',
              style: TextInputStyle.Paragraph,
              placeholder: 'Descrie cum ai reactiona in situatii dificile...',
              required: true,
              minLength: 50,
              maxLength: 1000,
            },
          ],
          [
            {
              customId: 'additionalInfo',
              label: 'Informatii suplimentare (optional)',
              style: TextInputStyle.Paragraph,
              placeholder: 'Orice altceva vrei sa ne spui...',
              required: false,
              maxLength: 500,
            },
          ],
        ],
      });

      await interaction.showModal(modal);

      // Wait for modal submission
      const filter = (i) => i.customId === `modal_application_${department}` && i.user.id === member.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 300000 });

      // Get responses
      const responses = {};
      modalInteraction.fields.fields.forEach((field) => {
        responses[field.customId] = field.value;
      });

      // Create application
      const application = await Application.create({
        guildId: guild.id,
        userId: member.id,
        department,
        status: 'pending',
        answers: responses,
      });

      // Send confirmation
      const embed = createEmbed({
        title: `🏛️ Aplicatie Trimisa - ${config.greenville.departments[department].name}`,
        description: `Aplicatia ta a fost trimisa cu succes!\n\n**Status:** In asteptare\n**Departament:** ${config.greenville.departments[department].name}\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>\n\nVei fi notificat cand aplicatia ta va fi review-uita!`,
        color: COLORS.success,
        timestamp: true,
      });

      await modalInteraction.reply({ embeds: [embed], ephemeral: true });

      // Notify staff
      const staffChannel = guild.channels.cache.get(config.channels?.staffChat);
      if (staffChannel) {
        const staffEmbed = createEmbed({
          title: '📋 Noa Aplicatie',
          description: `${member} a aplicat pentru **${config.greenville.departments[department].name}**!\n\n**Experienta:** ${responses.experience.substring(0, 200)}...\n**Motivatie:** ${responses.motivation.substring(0, 200)}...`,
          color: COLORS.primary,
          fields: [
            { name: 'Aplicant', value: `${member}`, inline: true },
            { name: 'Departament', value: config.greenville.departments[department].name, inline: true },
            { name: 'ID', value: application._id.toString(), inline: true },
          ],
          timestamp: true,
        });

        const buttons = createActionRow([
          createButton({ customId: `app_approve_${application._id}`, label: 'Aproba', style: ButtonStyle.Success, emoji: '✅' }),
          createButton({ customId: `app_reject_${application._id}`, label: 'Respinge', style: ButtonStyle.Danger, emoji: '❌' }),
          createButton({ customId: `app_review_${application._id}`, label: 'Review', style: ButtonStyle.Primary, emoji: '👁️' }),
        ]);

        await staffChannel.send({ embeds: [staffEmbed], components: [buttons] });
      }

      logger.info(`Application created: ${application._id} by ${member.user.tag} for ${department}`);
    } catch (error) {
      logger.error(`Failed to create application: ${error.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'A aparut o eroare la trimiterea aplicatiei!',
          ephemeral: true,
        });
      }
    }
  }

  static async handleButton(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('app_approve_')) {
      const appId = customId.split('_')[2];
      await this.approveApplication(interaction, appId);
    } else if (customId.startsWith('app_reject_')) {
      const appId = customId.split('_')[2];
      await this.rejectApplication(interaction, appId);
    } else if (customId.startsWith('app_review_')) {
      const appId = customId.split('_')[2];
      await this.reviewApplication(interaction, appId);
    }
  }

  static async approveApplication(interaction, appId) {
    try {
      if (!interaction.member.roles.cache.some(r => ['Founder', 'Admin'].includes(r.name))) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a aproba aplicatii!',
          ephemeral: true,
        });
      }

      const application = await Application.findById(appId);
      if (!application) {
        return interaction.reply({
          content: 'Aplicatia nu a fost gasita!',
          ephemeral: true,
        });
      }

      // Update application status
      application.status = 'approved';
      application.reviewedBy = interaction.member.id;
      application.reviewedAt = new Date();
      await application.save();

      // Add user to department
      let user = await User.findOne({ userId: application.userId, guildId: application.guildId });
      if (!user) {
        user = await User.create({
          userId: application.userId,
          guildId: application.guildId,
        });
      }

      user.departments[application.department].active = true;
      user.departments[application.department].rank = config.greenville.departments[application.department].ranks[1];
      user.departments[application.department].joinDate = new Date();
      await user.save();

      // Add department role to user
      const member = await interaction.guild.members.fetch(application.userId);
      const deptRole = interaction.guild.roles.cache.find(r => 
        r.name.includes(config.greenville.departments[application.department].name)
      );
      if (deptRole) {
        await member.roles.add(deptRole);
      }

      // Notify user
      try {
        const userEmbed = createEmbed({
          title: `✅ Aplicatie Aprobata - ${config.greenville.departments[application.department].name}`,
          description: `Felicitari! Aplicatia ta pentru **${config.greenville.departments[application.department].name}** a fost aprobata!\n\n**Rank:** ${config.greenville.departments[application.department].ranks[1]}\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>\n\nBine ai venit in echipa!`,
          color: COLORS.success,
          timestamp: true,
        });

        await member.send({ embeds: [userEmbed] });
      } catch (error) {
        logger.error(`Failed to DM user: ${error.message}`);
      }

      // Reply
      const embed = createEmbed({
        title: '✅ Aplicatie Aprobata',
        description: `Aplicatia pentru **${config.greenville.departments[application.department].name}** a fost aprobata!`,
        color: COLORS.success,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
      logger.info(`Application ${appId} approved by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to approve application: ${error.message}`);
    }
  }

  static async rejectApplication(interaction, appId) {
    try {
      if (!interaction.member.roles.cache.some(r => ['Founder', 'Admin'].includes(r.name))) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a respinge aplicatii!',
          ephemeral: true,
        });
      }

      const application = await Application.findById(appId);
      if (!application) {
        return interaction.reply({
          content: 'Aplicatia nu a fost gasita!',
          ephemeral: true,
        });
      }

      // Update application status
      application.status = 'rejected';
      application.reviewedBy = interaction.member.id;
      application.reviewedAt = new Date();
      await application.save();

      // Notify user
      try {
        const member = await interaction.guild.members.fetch(application.userId);
        const userEmbed = createEmbed({
          title: `❌ Aplicatie Respinsa - ${config.greenville.departments[application.department].name}`,
          description: `Aplicatia ta pentru **${config.greenville.departments[application.department].name}** a fost respinsa.\n\nPoti aplica din nou dupa 7 zile.\n\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: COLORS.danger,
          timestamp: true,
        });

        await member.send({ embeds: [userEmbed] });
      } catch (error) {
        logger.error(`Failed to DM user: ${error.message}`);
      }

      // Reply
      const embed = createEmbed({
        title: '❌ Aplicatie Respinsa',
        description: `Aplicatia pentru **${config.greenville.departments[application.department].name}** a fost respinsa!`,
        color: COLORS.danger,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
      logger.info(`Application ${appId} rejected by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to reject application: ${error.message}`);
    }
  }

  static async reviewApplication(interaction, appId) {
    try {
      const application = await Application.findById(appId);
      if (!application) {
        return interaction.reply({
          content: 'Aplicatia nu a fost gasita!',
          ephemeral: true,
        });
      }

      const user = await interaction.guild.members.fetch(application.userId);

      const embed = createEmbed({
        title: `📋 Review Aplicatie - ${config.greenville.departments[application.department].name}`,
        description: `**Aplicant:** ${user}\n**Departament:** ${config.greenville.departments[application.department].name}\n**Status:** ${application.status}\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>`,
        color: COLORS.primary,
        fields: [
          { name: '📝 Experienta', value: application.answers.experience || 'N/A', inline: false },
          { name: '💡 Motivatie', value: application.answers.motivation || 'N/A', inline: false },
          { name: '⏰ Disponibilitate', value: application.answers.availability || 'N/A', inline: true },
          { name: '🎭 Scenarii', value: application.answers.scenarios || 'N/A', inline: false },
          { name: 'ℹ️ Info Suplimentare', value: application.answers.additionalInfo || 'N/A', inline: false },
        ],
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to review application: ${error.message}`);
    }
  }

  static async handleModal(interaction) {
    // Modal handling is done in createApplication
  }

  static async handleSelectMenu(interaction) {
    // Select menu handling
  }
}

module.exports = ApplicationService;
