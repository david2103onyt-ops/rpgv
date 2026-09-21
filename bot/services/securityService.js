const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton } = require('../../utils/embeds');
const config = require('../../config');

class SecurityService {
  static async createSecurityPanel(interaction) {
    try {
      const embed = createEmbed({
        title: '🔒 Panou Securitate',
        description: 'Activeaza sau dezactiveaza sistemele de securitate ale serverului!',
        color: COLORS.primary,
        fields: [
          { name: '🛡️ Anti-Raid', value: 'Detecteaza si blocheaza raid-urile', inline: true },
          { name: '🔇 Anti-Spam', value: 'Previne spam-ul in canale', inline: true },
          { name: '💣 Anti-Nuke', value: 'Protejeaza impotriva stergerii canalelor', inline: true },
          { name: '👤 Auto-Ban', value: 'Ban automate pentru conturi noi', inline: true },
          { name: '🤖 Anti-Bot', value: 'Prevenirea adaugarii botilor neautorizati', inline: true },
        ],
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'security_toggle_raid', label: 'Anti-Raid', style: ButtonStyle.Success, emoji: '🛡️' }),
        createButton({ customId: 'security_toggle_spam', label: 'Anti-Spam', style: ButtonStyle.Success, emoji: '🔇' }),
        createButton({ customId: 'security_toggle_nuke', label: 'Anti-Nuke', style: ButtonStyle.Success, emoji: '💣' }),
        createButton({ customId: 'security_toggle_autoban', label: 'Auto-Ban', style: ButtonStyle.Success, emoji: '👤' }),
        createButton({ customId: 'security_toggle_antibot', label: 'Anti-Bot', style: ButtonStyle.Success, emoji: '🤖' }),
      ]);

      await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    } catch (error) {
      logger.error(`Failed to create security panel: ${error.message}`);
    }
  }

  static async handleButton(interaction) {
    const { customId } = interaction;

    if (customId.startsWith('security_toggle_')) {
      const system = customId.split('_')[2];
      await this.toggleSystem(interaction, system);
    }
  }

  static async toggleSystem(interaction, system) {
    try {
      if (!interaction.member.roles.cache.some(r => ['Founder', 'Admin'].includes(r.name))) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a modifica setarile de securitate!',
          ephemeral: true,
        });
      }

      const Guild = require('../../database/models/Guild');
      let guild = await Guild.findOne({ guildId: interaction.guild.id });
      
      if (!guild) {
        guild = await Guild.create({ guildId: interaction.guild.id });
      }

      const systemMap = {
        raid: 'antiRaid',
        spam: 'antiSpam',
        nuke: 'antiNuke',
        autoban: 'autoBanNewAccounts',
        antibot: 'antiBot',
      };

      const setting = systemMap[system];
      if (!setting) return;

      // Toggle setting
      guild.settings[setting] = !guild.settings[setting];
      await guild.save();

      const status = guild.settings[setting] ? 'activat' : 'dezactivat';
      const emoji = guild.settings[setting] ? '✅' : '❌';

      const embed = createEmbed({
        title: `${emoji} Securitate Actualizata`,
        description: `Sistemul de **${system.toUpperCase()}** a fost ${status}!`,
        color: guild.settings[setting] ? COLORS.success : COLORS.danger,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed], ephemeral: true });

      // Log
      const securityLog = interaction.guild.channels.cache.get(config.channels?.securityLog);
      if (securityLog) {
        const logEmbed = createEmbed({
          title: '🔒 Securitate Modificata',
          description: `${interaction.member} a ${status} sistemul de **${system.toUpperCase()}**`,
          color: guild.settings[setting] ? COLORS.success : COLORS.danger,
          timestamp: true,
        });

        await securityLog.send({ embeds: [logEmbed] });
      }

      logger.info(`Security system ${system} ${status} by ${interaction.member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to toggle security system: ${error.message}`);
    }
  }

  static async checkRaid(guild, member) {
    try {
      const now = Date.now();
      const windowMs = config.security.raidWindowMinutes * 60 * 1000;
      
      if (!guild.raidTracker) {
        guild.raidTracker = [];
      }
      
      guild.raidTracker.push(now);
      
      // Remove old joins
      guild.raidTracker = guild.raidTracker.filter(t => now - t < windowMs);
      
      if (guild.raidTracker.length >= config.security.maxJoinsRaid) {
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to check raid: ${error.message}`);
      return false;
    }
  }

  static async checkSpam(client, userId) {
    try {
      const now = Date.now();
      
      if (!client.messageTracker.has(userId)) {
        client.messageTracker.set(userId, []);
      }
      
      const timestamps = client.messageTracker.get(userId);
      timestamps.push(now);
      
      // Remove old timestamps
      const recentTimestamps = timestamps.filter(t => now - t < 1000);
      client.messageTracker.set(userId, recentTimestamps);
      
      if (recentTimestamps.length > config.security.maxMessagesPerSecond) {
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to check spam: ${error.message}`);
      return false;
    }
  }

  static async checkNewAccount(member) {
    try {
      const accountAge = Date.now() - member.user.createdTimestamp;
      const daysOld = accountAge / (1000 * 60 * 60 * 24);
      
      if (daysOld < config.security.autoBanNewAccountDays) {
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Failed to check new account: ${error.message}`);
      return false;
    }
  }
}

module.exports = SecurityService;
