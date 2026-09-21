const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../../utils/logger');
const User = require('../../../database/models/User');
const { createEmbed, COLORS } = require('../../../utils/embeds');
const { canModerate } = require('../../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Avertizeaza un utilizator')
    .addUserOption(option =>
      option.setName('user').setDescription('Utilizatorul de avertizat').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason').setDescription('Motivul avertismentului').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    try {
      const target = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const member = await interaction.guild.members.fetch(target.id);

      if (!canModerate(interaction.member, member)) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a avertiza acest utilizator!',
          ephemeral: true,
        });
      }

      // Update user warns
      let user = await User.findOne({ userId: target.id, guildId: interaction.guild.id });
      if (!user) {
        user = await User.create({ userId: target.id, guildId: interaction.guild.id });
      }

      user.warns += 1;
      user.warnHistory.push({
        reason,
        moderator: interaction.user.id,
        date: new Date(),
      });
      await user.save();

      // Create embed
      const embed = createEmbed({
        title: '⚠️ Utilizator Avertizat',
        description: `${target} a fost avertizat!`,
        color: COLORS.warning,
        fields: [
          { name: '📋 Motiv', value: reason, inline: false },
          { name: '⚠️ Warnings', value: `${user.warns}/3`, inline: true },
          { name: '👮 Moderator', value: `${interaction.user}`, inline: true },
        ],
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });

      // DM user
      try {
        const dmEmbed = createEmbed({
          title: '⚠️ Avertisment',
          description: `Ai primit un avertisment pe **${interaction.guild.name}**!`,
          color: COLORS.warning,
          fields: [
            { name: '📋 Motiv', value: reason, inline: false },
            { name: '⚠️ Warnings', value: `${user.warns}/3`, inline: true },
            { name: '👮 Moderator', value: interaction.user.tag, inline: true },
          ],
          timestamp: true,
        });

        await target.send({ embeds: [dmEmbed] });
      } catch (error) {
        logger.error(`Failed to DM user: ${error.message}`);
      }

      // Auto-action based on warns
      if (user.warns >= 3) {
        await member.ban({ reason: '3 avertismente atinse' });
        await interaction.followUp({
          content: `${target} a fost banat automat pentru 3 avertismente!`,
        });
      } else if (user.warns >= 2) {
        await member.timeout(24 * 60 * 60 * 1000, '2 avertismente');
        await interaction.followUp({
          content: `${target} a fost timeout 24h pentru 2 avertismente!`,
        });
      }

      logger.info(`User ${target.tag} warned by ${interaction.user.tag}: ${reason}`);
    } catch (error) {
      logger.error(`Warn error: ${error.message}`);
      await interaction.reply({
        content: `A aparut o eroare: ${error.message}`,
        ephemeral: true,
      });
    }
  },
};
