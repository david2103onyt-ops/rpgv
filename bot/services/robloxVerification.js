const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const User = require('../../database/models/User');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton, createModal } = require('../../utils/embeds');
const config = require('../../config');
const crypto = require('crypto');

class RobloxVerification {
  static generateCode() {
    return 'GRV-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  static async getRobloxUser(userId) {
    try {
      const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      if (!response.ok) return null;
      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        created: data.created,
        isBanned: data.isBanned,
      };
    } catch (error) {
      logger.error(`Failed to fetch Roblox user: ${error.message}`);
      return null;
    }
  }

  static async getRobloxUserId(username) {
    try {
      const response = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username] }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].id;
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get Roblox user ID: ${error.message}`);
      return null;
    }
  }

  static async getRobloxAvatar(userId) {
    try {
      const response = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=true`);
      if (!response.ok) return null;
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].imageUrl;
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get Roblox avatar: ${error.message}`);
      return null;
    }
  }

  static async startVerification(interaction) {
    try {
      const member = interaction.member;

      // Check if already verified
      let user = await User.findOne({ userId: member.id, guildId: interaction.guild.id });
      if (user && user.robloxId) {
        return interaction.reply({
          content: 'Esti deja verificat cu un cont Roblox!',
          ephemeral: true,
        });
      }

      // Ask for Roblox username
      const modal = createModal({
        customId: `modal_roblox_verify_${member.id}`,
        title: 'Verificare Roblox',
        components: [
          [
            {
              customId: 'roblox_username',
              label: 'Username Roblox',
              style: TextInputStyle.Short,
              placeholder: 'Introdu username-ul tau de Roblox...',
              required: true,
              maxLength: 100,
            },
          ],
        ],
      });

      await interaction.showModal(modal);

      // Wait for modal submission
      const filter = (i) => i.customId === `modal_roblox_verify_${member.id}` && i.user.id === member.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 60000 });

      const robloxUsername = modalInteraction.fields.getTextInputValue('roblox_username');

      // Get Roblox user ID
      const robloxId = await this.getRobloxUserId(robloxUsername);
      if (!robloxId) {
        return modalInteraction.reply({
          content: `❌ Nu am gasit utilizatorul **${robloxUsername}** pe Roblox! Verifica username-ul si incearca din nou.`,
          ephemeral: true,
        });
      }

      // Get Roblox user info
      const robloxUser = await this.getRobloxUser(robloxId);
      if (!robloxUser) {
        return modalInteraction.reply({
          content: '❌ Nu am putut obtine informatiile de pe Roblox!',
          ephemeral: true,
        });
      }

      // Generate verification code
      const verificationCode = this.generateCode();

      // Save to database
      if (!user) {
        user = await User.create({ userId: member.id, guildId: interaction.guild.id });
      }

      user.robloxVerification = {
        code: verificationCode,
        robloxId: robloxId,
        robloxUsername: robloxUser.name,
        verified: false,
        createdAt: new Date(),
      };
      await user.save();

      // Get Roblox avatar
      const avatar = await this.getRobloxAvatar(robloxId);

      // Send instructions
      const embed = createEmbed({
        title: '🎮 Verificare Roblox - Pasul 1',
        description: `**Username gasit:** ${robloxUser.name}\n**Display Name:** ${robloxUser.displayName}\n\n**Urmatorii pasi:**\n1. Deschide Roblox si mergi la profilul tau\n2. Click pe **Edit Profile** (creionul)\n3. La **Description** pune urmatorul cod:\n\`\`\`\n${verificationCode}\n\`\`\`\n4. Click pe butonul de mai jos cand ai terminat`,
        color: COLORS.primary,
        thumbnail: avatar ? { url: avatar } : null,
        fields: [
          { name: '🔐 Cod de verificare', value: `\`${verificationCode}\``, inline: true },
          { name: '🎮 Roblox ID', value: `${robloxId}`, inline: true },
        ],
        footer: { text: 'Codul expira in 10 minute!' },
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: `roblox_check_${member.id}_${robloxId}`, label: 'Verifica Acum', style: ButtonStyle.Success, emoji: '✅' }),
        createButton({ customId: `roblox_cancel_${member.id}`, label: 'Anuleaza', style: ButtonStyle.Danger, emoji: '❌' }),
      ]);

      await modalInteraction.reply({ embeds: [embed], components: [buttons], ephemeral: true });

      logger.info(`Roblox verification started for ${member.user.tag} with Roblox user ${robloxUser.name}`);
    } catch (error) {
      logger.error(`Failed to start Roblox verification: ${error.message}`);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'A aparut o eroare la verificare!',
          ephemeral: true,
        });
      }
    }
  }

  static async checkVerification(interaction, userId, robloxId) {
    try {
      const member = await interaction.guild.members.fetch(userId);
      
      // Get user from database
      const user = await User.findOne({ userId: userId, guildId: interaction.guild.id });
      if (!user || !user.robloxVerification) {
        return interaction.reply({
          content: '❌ Nu ai inca o verificare in curs!',
          ephemeral: true,
        });
      }

      // Get Roblox profile
      const robloxUser = await this.getRobloxUser(robloxId);
      if (!robloxUser) {
        return interaction.reply({
          content: '❌ Nu am putut obtine profilul Roblox!',
          ephemeral: true,
        });
      }

      // Check if code is in description
      const code = user.robloxVerification.code;
      if (!robloxUser.description || !robloxUser.description.includes(code)) {
        return interaction.reply({
          content: `❌ Codul **${code}** nu a fost gasit in descrierea profilului tau Roblox!\n\nAsigura-te ca:\n1. Ai pus codul exact: \`${code}\`\n2. Ai salvat modificarile\n3. Profilul este public\n\nIncearca din nou!`,
          ephemeral: true,
        });
      }

      // Verification successful!
      user.robloxId = robloxId;
      user.robloxUsername = robloxUser.name;
      user.robloxVerification.verified = true;
      user.robloxVerification.verifiedAt = new Date();
      await user.save();

      // Set Discord nickname to Roblox username
      try {
        await member.setNickname(robloxUser.name);
      } catch (error) {
        logger.error(`Failed to set nickname: ${error.message}`);
      }

      // Add verified role
      if (config.roles?.verified) {
        const verifiedRole = interaction.guild.roles.cache.get(config.roles.verified);
        if (verifiedRole) {
          await member.roles.add(verifiedRole);
        }
      }

      // Remove unverified role
      if (config.roles?.unverified) {
        const unverifiedRole = interaction.guild.roles.cache.get(config.roles.unverified);
        if (unverifiedRole) {
          await member.roles.remove(unverifiedRole);
        }
      }

      // Get avatar for embed
      const avatar = await this.getRobloxAvatar(robloxId);

      // Success embed
      const embed = createEmbed({
        title: '✅ Verificare Roblox Completata!',
        description: `Contul tau Discord a fost conectat cu succes la contul Roblox!\n\n**Roblox Username:** ${robloxUser.name}\n**Display Name:** ${robloxUser.displayName}\n**Nume Discord:** Setat automat la ${robloxUser.name}\n\nAcum ai acces complet la server!`,
        color: COLORS.success,
        thumbnail: avatar ? { url: avatar } : null,
        fields: [
          { name: '🎮 Roblox ID', value: `${robloxId}`, inline: true },
          { name: '👤 Discord', value: `${member}`, inline: true },
          { name: '📅 Verificat', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
        ],
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Log to staff channel
      const staffChannel = interaction.guild.channels.cache.get(config.channels?.staffChat);
      if (staffChannel) {
        const logEmbed = createEmbed({
          title: '🎮 Verificare Roblox',
          description: `${member} s-a verificat cu contul **${robloxUser.name}**`,
          color: COLORS.success,
          thumbnail: avatar ? { url: avatar } : null,
          timestamp: true,
        });

        await staffChannel.send({ embeds: [logEmbed] });
      }

      logger.info(`Roblox verification completed for ${member.user.tag} - Roblox: ${robloxUser.name}`);
    } catch (error) {
      logger.error(`Failed to check Roblox verification: ${error.message}`);
      await interaction.reply({
        content: '❌ A aparut o eroare la verificare!',
        ephemeral: true,
      });
    }
  }

  static async cancelVerification(interaction, userId) {
    try {
      const user = await User.findOne({ userId: userId, guildId: interaction.guild.id });
      if (user) {
        user.robloxVerification = undefined;
        await user.save();
      }

      const embed = createEmbed({
        title: '❌ Verificare Anulata',
        description: 'Verificarea Roblox a fost anulata!',
        color: COLORS.danger,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to cancel Roblox verification: ${error.message}`);
    }
  }

  static async unlinkRoblox(interaction) {
    try {
      const member = interaction.member;
      const user = await User.findOne({ userId: member.id, guildId: interaction.guild.id });

      if (!user || !user.robloxId) {
        return interaction.reply({
          content: '❌ Nu esti verificat cu un cont Roblox!',
          ephemeral: true,
        });
      }

      const robloxUsername = user.robloxUsername;

      // Remove Roblox data
      user.robloxId = undefined;
      user.robloxUsername = undefined;
      user.robloxVerification = undefined;
      await user.save();

      // Reset nickname
      try {
        await member.setNickname(null);
      } catch (error) {
        logger.error(`Failed to reset nickname: ${error.message}`);
      }

      const embed = createEmbed({
        title: '🔓 Roblox Deconectat',
        description: `Contul Roblox **${robloxUsername}** a fost deconectat!\n\nNumele Discord a fost resetat.`,
        color: COLORS.warning,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      logger.info(`Roblox unlinked for ${member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to unlink Roblox: ${error.message}`);
    }
  }

  static async handleButton(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('roblox_check_')) {
      const parts = customId.split('_');
      const userId = parts[2];
      const robloxId = parts[3];
      await this.checkVerification(interaction, userId, robloxId);
    }

    if (customId.startsWith('roblox_cancel_')) {
      const userId = customId.split('_')[2];
      await this.cancelVerification(interaction, userId);
    }

    if (customId === 'roblox_verify') {
      await this.startVerification(interaction);
    }

    if (customId === 'roblox_unlink') {
      await this.unlinkRoblox(interaction);
    }
  }
}

module.exports = RobloxVerification;
