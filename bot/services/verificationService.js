const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const User = require('../../database/models/User');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createModal } = require('../../utils/embeds');
const config = require('../../config');
const RobloxVerification = require('./robloxVerification');

class VerificationService {
  static async createVerification(interaction) {
    try {
      const guild = interaction.guild;
      const member = interaction.member;

      // Check if already verified
      let user = await User.findOne({ userId: member.id, guildId: guild.id });
      if (user && user.isVerified) {
        return interaction.reply({
          content: 'Esti deja verificat!',
          ephemeral: true,
        });
      }

      // Show verification modal
      const modal = createModal({
        customId: `modal_verify_${member.id}`,
        title: 'Formular Verificare',
        components: [
          [
            {
              customId: 'realName',
              label: 'Nume Real (optional)',
              style: TextInputStyle.Short,
              placeholder: 'Numele tau real...',
              required: false,
              maxLength: 100,
            },
          ],
          [
            {
              customId: 'age',
              label: 'Varsta',
              style: TextInputStyle.Short,
              placeholder: 'Varsta ta...',
              required: true,
              maxLength: 3,
            },
          ],
          [
            {
              customId: 'experience',
              label: 'Experienta in roleplay',
              style: TextInputStyle.Paragraph,
              placeholder: 'Descrie experienta ta in roleplay...',
              required: true,
              minLength: 50,
              maxLength: 500,
            },
          ],
          [
            {
              customId: 'motivation',
              label: 'De ce vrei sa te alaturi?',
              style: TextInputStyle.Paragraph,
              placeholder: 'Spune-ne de ce vrei sa te alaturi serverului...',
              required: true,
              minLength: 50,
              maxLength: 500,
            },
          ],
        ],
      });

      await interaction.showModal(modal);

      // Wait for modal submission
      const filter = (i) => i.customId === `modal_verify_${member.id}` && i.user.id === member.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 300000 });

      // Get responses
      const responses = {};
      modalInteraction.fields.fields.forEach((field) => {
        responses[field.customId] = field.value;
      });

      // Create or update user
      if (!user) {
        user = await User.create({
          userId: member.id,
          guildId: guild.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          avatar: member.user.avatarURL(),
        });
      }

      user.verificationData = {
        realName: responses.realName || null,
        age: parseInt(responses.age),
        experience: responses.experience,
        motivation: responses.motivation,
      };
      await user.save();

      // Send confirmation
      const embed = createEmbed({
        title: '📋 Verificare Trimisa',
        description: `Formularul tau de verificare a fost trimis!\n\n**Status:** In asteptare\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>\n\nUn staff member va review-ui cererea ta in curand!`,
        color: COLORS.success,
        timestamp: true,
      });

      await modalInteraction.reply({ embeds: [embed], ephemeral: true });

      // Notify staff
      const staffChannel = guild.channels.cache.get(config.channels?.staffChat);
      if (staffChannel) {
        const staffEmbed = createEmbed({
          title: '📋 Noa Cerere de Verificare',
          description: `${member} a trimis o cerere de verificare!\n\n**Varsta:** ${responses.age}\n**Experienta:** ${responses.experience.substring(0, 200)}...\n**Motivatie:** ${responses.motivation.substring(0, 200)}...`,
          color: COLORS.primary,
          fields: [
            { name: 'User', value: `${member}`, inline: true },
            { name: 'Varsta', value: responses.age, inline: true },
            { name: 'ID', value: member.id, inline: true },
          ],
          timestamp: true,
        });

        const buttons = createActionRow([
          createButton({ customId: `verify_approve_${member.id}`, label: 'Aproba', style: ButtonStyle.Success, emoji: '✅' }),
          createButton({ customId: `verify_reject_${member.id}`, label: 'Respinge', style: ButtonStyle.Danger, emoji: '❌' }),
        ]);

        await staffChannel.send({ embeds: [staffEmbed], components: [buttons] });
      }

      logger.info(`Verification request from ${member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to create verification: ${error.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'A aparut o eroare la trimiterea formularului!',
          ephemeral: true,
        });
      }
    }
  }

  static async createRobloxVerification(interaction) {
    await RobloxVerification.startVerification(interaction);
  }

  static async handleButton(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('verify_approve_')) {
      const userId = customId.split('_')[2];
      await this.approveVerification(interaction, userId);
    } else if (customId.startsWith('verify_reject_')) {
      const userId = customId.split('_')[2];
      await this.rejectVerification(interaction, userId);
    } else if (customId === 'verify_start') {
      await this.createVerification(interaction);
    } else if (customId === 'verify_roblox') {
      await this.createRobloxVerification(interaction);
    }

    // Handle Roblox buttons
    if (customId.startsWith('roblox_')) {
      await RobloxVerification.handleButton(interaction);
    }
  }

  static async approveVerification(interaction, userId) {
    try {
      if (!interaction.member.roles.cache.some(r => ['Founder', 'Admin', 'Moderator'].includes(r.name))) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a aproba verificari!',
          ephemeral: true,
        });
      }

      const user = await User.findOne({ userId, guildId: interaction.guild.id });
      if (!user) {
        return interaction.reply({
          content: 'User-ul nu a fost gasit!',
          ephemeral: true,
        });
      }

      // Update user
      user.isVerified = true;
      await user.save();

      // Add verified role, remove unverified
      const member = await interaction.guild.members.fetch(userId);
      if (config.roles?.verified) {
        await member.roles.add(config.roles.verified);
      }
      if (config.roles?.unverified) {
        await member.roles.remove(config.roles.unverified);
      }

      // If Roblox is linked, set nickname
      if (user.robloxUsername) {
        try {
          await member.setNickname(user.robloxUsername);
        } catch (error) {
          logger.error(`Failed to set nickname: ${error.message}`);
        }
      }

      // Notify user
      try {
        const userEmbed = createEmbed({
          title: '✅ Verificare Aprobata',
          description: `Verificarea ta a fost aprobata! Acum ai acces la toate canalele serverului.\n\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: COLORS.success,
          timestamp: true,
        });

        await member.send({ embeds: [userEmbed] });
      } catch (error) {
        logger.error(`Failed to DM user: ${error.message}`);
      }

      // Reply
      const embed = createEmbed({
        title: '✅ Verificare Aprobata',
        description: `Verificarea lui ${member} a fost aprobata!`,
        color: COLORS.success,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
      logger.info(`Verification for ${userId} approved by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to approve verification: ${error.message}`);
    }
  }

  static async rejectVerification(interaction, userId) {
    try {
      if (!interaction.member.roles.cache.some(r => ['Founder', 'Admin', 'Moderator'].includes(r.name))) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a respinge verificari!',
          ephemeral: true,
        });
      }

      const user = await User.findOne({ userId, guildId: interaction.guild.id });
      if (!user) {
        return interaction.reply({
          content: 'User-ul nu a fost gasit!',
          ephemeral: true,
        });
      }

      // Notify user
      try {
        const member = await interaction.guild.members.fetch(userId);
        const userEmbed = createEmbed({
          title: '❌ Verificare Respinsa',
          description: `Verificarea ta a fost respinsa.\n\nPoti incerca din nou dupa 24 de ore.\n\n**Data:** <t:${Math.floor(Date.now() / 1000)}:R>`,
          color: COLORS.danger,
          timestamp: true,
        });

        await member.send({ embeds: [userEmbed] });
      } catch (error) {
        logger.error(`Failed to DM user: ${error.message}`);
      }

      // Reply
      const embed = createEmbed({
        title: '❌ Verificare Respinsa',
        description: `Verificarea lui <@${userId}> a fost respinsa!`,
        color: COLORS.danger,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
      logger.info(`Verification for ${userId} rejected by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to reject verification: ${error.message}`);
    }
  }
}

module.exports = VerificationService;
