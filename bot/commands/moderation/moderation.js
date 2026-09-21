const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../../utils/logger');
const { createEmbed, COLORS } = require('../../../utils/embeds');
const { canModerate } = require('../../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('moderation')
    .setDescription('Comenzi de moderare')
    .addSubcommand(sub =>
      sub.setName('kick').setDescription('Scoate un utilizator')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Motivul'))
    )
    .addSubcommand(sub =>
      sub.setName('ban').setDescription('Ban un utilizator')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Motivul'))
    )
    .addSubcommand(sub =>
      sub.setName('unban').setDescription('Unban un utilizator')
        .addStringOption(opt => opt.setName('userid').setDescription('ID-ul utilizatorului').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('timeout').setDescription('Timeout un utilizator')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
        .addIntegerOption(opt => opt.setName('minutes').setDescription('Minutele').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('Motivul'))
    )
    .addSubcommand(sub =>
      sub.setName('untimeout').setDescription('Scoate timeout-ul')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('purge').setDescription('Sterge mesaje')
        .addIntegerOption(opt => opt.setName('amount').setDescription('Numarul de mesaje (1-100)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('slowmode').setDescription('Seteaza slowmode')
        .addIntegerOption(opt => opt.setName('seconds').setDescription('Secunde').setRequired(true))
    )
    .addSubsubcommand(sub =>
      sub.setName('lock').setDescription('Blocheaza canalul')
    )
    .addSubcommand(sub =>
      sub.setName('unlock').setDescription('Deblocheaza canalul')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'kick':
          await this.kick(interaction);
          break;
        case 'ban':
          await this.ban(interaction);
          break;
        case 'unban':
          await this.unban(interaction);
          break;
        case 'timeout':
          await this.timeout(interaction);
          break;
        case 'untimeout':
          await this.untimeout(interaction);
          break;
        case 'purge':
          await this.purge(interaction);
          break;
        case 'slowmode':
          await this.slowmode(interaction);
          break;
        case 'lock':
          await this.lock(interaction);
          break;
        case 'unlock':
          await this.unlock(interaction);
          break;
      }
    } catch (error) {
      logger.error(`Moderation error: ${error.message}`);
      await interaction.reply({
        content: `A aparut o eroare: ${error.message}`,
        ephemeral: true,
      });
    }
  },

  async kick(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Fara motiv';
    const member = await interaction.guild.members.fetch(target.id);

    if (!canModerate(interaction.member, member)) {
      return interaction.reply({
        content: 'Nu ai permisiunea de a scoate acest utilizator!',
        ephemeral: true,
      });
    }

    await member.kick(reason);

    const embed = createEmbed({
      title: '👢 Utilizator Scos',
      description: `${target} a fost scos din server!`,
      color: COLORS.warning,
      fields: [
        { name: '📋 Motiv', value: reason, inline: false },
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`User ${target.tag} kicked by ${interaction.user.tag}: ${reason}`);
  },

  async ban(interaction) {
    const target = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'Fara motiv';
    const member = await interaction.guild.members.fetch(target.id);

    if (!canModerate(interaction.member, member)) {
      return interaction.reply({
        content: 'Nu ai permisiunea de a bana acest utilizator!',
        ephemeral: true,
      });
    }

    await member.ban({ reason });

    const embed = createEmbed({
      title: '🔨 Utilizator Banat',
      description: `${target} a fost banat din server!`,
      color: COLORS.danger,
      fields: [
        { name: '📋 Motiv', value: reason, inline: false },
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`User ${target.tag} banned by ${interaction.user.tag}: ${reason}`);
  },

  async unban(interaction) {
    const userId = interaction.options.getString('userid');

    try {
      await interaction.guild.members.unban(userId);

      const embed = createEmbed({
        title: '✅ Utilizator Deblocat',
        description: `User-ul cu ID ${userId} a fost deblocat!`,
        color: COLORS.success,
        fields: [
          { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
        ],
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
      logger.info(`User ${userId} unbanned by ${interaction.user.tag}`);
    } catch (error) {
      await interaction.reply({
        content: 'Nu am putut debloca utilizatorul! Verifica ID-ul.',
        ephemeral: true,
      });
    }
  },

  async timeout(interaction) {
    const target = interaction.options.getUser('user');
    const minutes = interaction.options.getInteger('minutes');
    const reason = interaction.options.getString('reason') || 'Fara motiv';
    const member = await interaction.guild.members.fetch(target.id);

    if (!canModerate(interaction.member, member)) {
      return interaction.reply({
        content: 'Nu ai permisiunea de a pune timeout acestui utilizator!',
        ephemeral: true,
      });
    }

    await member.timeout(minutes * 60 * 1000, reason);

    const embed = createEmbed({
      title: '🔇 Timeout',
      description: `${target} a primit timeout pentru ${minutes} minute!`,
      color: COLORS.warning,
      fields: [
        { name: '📋 Motiv', value: reason, inline: false },
        { name: '⏰ Durata', value: `${minutes} minute`, inline: true },
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`User ${target.tag} timed out by ${interaction.user.tag} for ${minutes} minutes`);
  },

  async untimeout(interaction) {
    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id);

    await member.timeout(null);

    const embed = createEmbed({
      title: '🔊 Timeout Scoas',
      description: `${target} nu mai are timeout!`,
      color: COLORS.success,
      fields: [
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`User ${target.tag} timeout removed by ${interaction.user.tag}`);
  },

  async purge(interaction) {
    const amount = interaction.options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: 'Numarul trebuie sa fie intre 1 si 100!',
        ephemeral: true,
      });
    }

    const messages = await interaction.channel.bulkDelete(amount, true);

    const embed = createEmbed({
      title: '🗑️ Mesaje Sterse',
      description: `${messages.size} mesaje au fost sterse!`,
      color: COLORS.success,
      fields: [
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
    logger.info(`${messages.size} messages purged by ${interaction.user.tag}`);
  },

  async slowmode(interaction) {
    const seconds = interaction.options.getInteger('seconds');

    await interaction.channel.setRateLimitPerUser(seconds);

    const embed = createEmbed({
      title: '⏱️ Slowmode Setat',
      description: `Slowmode-ul a fost setat la ${seconds} secunde!`,
      color: COLORS.success,
      fields: [
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`Slowmode set to ${seconds}s by ${interaction.user.tag}`);
  },

  async lock(interaction) {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
      SendMessages: false,
    });

    const embed = createEmbed({
      title: '🔒 Canal Blocat',
      description: 'Canalul a fost blocat!',
      color: COLORS.danger,
      fields: [
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`Channel locked by ${interaction.user.tag}`);
  },

  async unlock(interaction) {
    await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
      SendMessages: true,
    });

    const embed = createEmbed({
      title: '🔓 Canal Deblocat',
      description: 'Canalul a fost deblocat!',
      color: COLORS.success,
      fields: [
        { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
    logger.info(`Channel unlocked by ${interaction.user.tag}`);
  },
};
