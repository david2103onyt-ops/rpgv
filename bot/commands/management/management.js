const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../../utils/logger');
const Guild = require('../../../database/models/Guild');
const User = require('../../../database/models/User');
const { createEmbed, COLORS } = require('../../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('management')
    .setDescription('Comenzi de management')
    .addSubcommand(sub =>
      sub.setName('config').setDescription('Vezi configuratia serverului')
    )
    .addSubcommand(sub =>
      sub.setName('stats').setDescription('Statistici server')
    )
    .addSubcommand(sub =>
      sub.setName('rank').setDescription('Vezi rank-ul tau')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul'))
    )
    .addSubcommand(sub =>
      sub.setName('leaderboard').setDescription('Clasament membri')
    )
    .addSubcommand(sub =>
      sub.setName('embed').setDescription('Trimite un embed custom')
        .addStringOption(opt => opt.setName('title').setDescription('Titlul').setRequired(true))
        .addStringOption(opt => opt.setName('description').setDescription('Descrierea').setRequired(true))
        .addStringOption(opt => opt.setName('color').setDescription('Culoarea (hex)'))
        .addChannelOption(opt => opt.setName('channel').setDescription('Canalul'))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'config':
          await this.config(interaction);
          break;
        case 'stats':
          await this.stats(interaction);
          break;
        case 'rank':
          await this.rank(interaction);
          break;
        case 'leaderboard':
          await this.leaderboard(interaction);
          break;
        case 'embed':
          await this.embed(interaction);
          break;
      }
    } catch (error) {
      logger.error(`Management error: ${error.message}`);
      await interaction.reply({
        content: `A aparut o eroare: ${error.message}`,
        ephemeral: true,
      });
    }
  },

  async config(interaction) {
    const guild = await Guild.findOne({ guildId: interaction.guild.id });

    if (!guild) {
      return interaction.reply({
        content: 'Configuratia nu a fost gasita! Ruleaza /setup intai.',
        ephemeral: true,
      });
    }

    const embed = createEmbed({
      title: '⚙️ Configuratie Server',
      description: `Configuratia serverului **${interaction.guild.name}**`,
      color: COLORS.primary,
      fields: [
        { name: '📋 Prefix', value: guild.settings.prefix, inline: true },
        { name: '🎫 Tickete', value: guild.settings.ticketEnabled ? '✅' : '❌', inline: true },
        { name: '✅ Verificare', value: guild.settings.verificationEnabled ? '✅' : '❌', inline: true },
        { name: '🔒 Securitate', value: guild.settings.securityEnabled ? '✅' : '❌', inline: true },
        { name: '🛡️ Anti-Raid', value: guild.settings.antiRaid ? '✅' : '❌', inline: true },
        { name: '🔇 Anti-Spam', value: guild.settings.antiSpam ? '✅' : '❌', inline: true },
        { name: '💣 Anti-Nuke', value: guild.settings.antiNuke ? '✅' : '❌', inline: true },
        { name: '👤 Auto-Ban', value: guild.settings.autoBanNewAccounts ? '✅' : '❌', inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  async stats(interaction) {
    const guild = interaction.guild;
    const memberCount = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const channels = guild.channels.cache.size;
    const roles = guild.roles.cache.size;

    const embed = createEmbed({
      title: '📊 Statistici Server',
      description: `Statisticile serverului **${guild.name}**`,
      color: COLORS.primary,
      fields: [
        { name: '👥 Membri', value: `${memberCount}`, inline: true },
        { name: '🟢 Online', value: `${onlineMembers}`, inline: true },
        { name: '📁 Canale', value: `${channels}`, inline: true },
        { name: '🏷️ Roluri', value: `${roles}`, inline: true },
        { name: '📅 Creat', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '👑 Owner', value: `${guild.owner}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
  },

  async rank(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;
    const user = await User.findOne({ userId: target.id, guildId: interaction.guild.id });

    if (!user) {
      return interaction.reply({
        content: 'User-ul nu a fost gasit in baza de date!',
        ephemeral: true,
      });
    }

    const xpNeeded = user.level * 100 + 100;
    const progress = Math.round((user.xp / xpNeeded) * 20);
    const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = createEmbed({
      title: `🏆 Rank - ${target.username}`,
      description: `Rank-ul lui ${target}`,
      color: COLORS.primary,
      fields: [
        { name: '📊 Nivel', value: `${user.level}`, inline: true },
        { name: '⭐ XP', value: `${user.xp}/${xpNeeded}`, inline: true },
        { name: '💰 Credite', value: `${user.credits}`, inline: true },
        { name: '📈 Progres', value: `\`${progressBar}\``, inline: false },
        { name: '📝 Mesaje', value: `${user.activity.messages}`, inline: true },
        { name: '🔊 Voice', value: `${user.activity.voiceMinutes} min`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
  },

  async leaderboard(interaction) {
    const users = await User.find({ guildId: interaction.guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(10);

    if (users.length === 0) {
      return interaction.reply({
        content: 'Nu sunt utilizatori in baza de date!',
        ephemeral: true,
      });
    }

    const embed = createEmbed({
      title: '🏆 Clasament',
      description: 'Top 10 membrii',
      color: COLORS.primary,
      fields: users.map((user, index) => ({
        name: `#${index + 1} ${user.username || user.userId}`,
        value: `Nivel: ${user.level} | XP: ${user.xp} | Credite: ${user.credits}`,
        inline: false,
      })),
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
  },

  async embed(interaction) {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color') || '#FF6B00';
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = createEmbed({
      title,
      description,
      color,
      timestamp: true,
    });

    await channel.send({ embeds: [embed] });

    if (channel.id !== interaction.channel.id) {
      await interaction.reply({
        content: `Embed trimis in ${channel}!`,
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'Embed trimis!',
        ephemeral: true,
      });
    }
  },
};
