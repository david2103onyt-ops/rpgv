const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const logger = require('../../../utils/logger');
const User = require('../../../database/models/User');
const { createEmbed, COLORS } = require('../../../utils/embeds');
const { isStaff } = require('../../../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('staff')
    .setDescription('Comenzi staff')
    .addSubcommand(sub =>
      sub.setName('add').setDescription('Adauga un staff member')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
        .addStringOption(opt => opt.setName('role').setDescription('Rolul').setRequired(true)
          .addChoices(
            { name: 'Helper', value: 'Helper' },
            { name: 'Moderator', value: 'Moderator' },
            { name: 'Admin', value: 'Admin' },
          ))
    )
    .addSubcommand(sub =>
      sub.setName('remove').setDescription('Scoate un staff member')
        .addUserOption(opt => opt.setName('user').setDescription('Utilizatorul').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list').setDescription('Lista staff members')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
        case 'add':
          await this.add(interaction);
          break;
        case 'remove':
          await this.remove(interaction);
          break;
        case 'list':
          await this.list(interaction);
          break;
      }
    } catch (error) {
      logger.error(`Staff error: ${error.message}`);
      await interaction.reply({
        content: `A aparut o eroare: ${error.message}`,
        ephemeral: true,
      });
    }
  },

  async add(interaction) {
    const target = interaction.options.getUser('user');
    const roleName = interaction.options.getString('role');
    const member = await interaction.guild.members.fetch(target.id);

    // Check if user already has a higher role
    if (isStaff(member)) {
      return interaction.reply({
        content: 'Utilizatorul este deja staff!',
        ephemeral: true,
      });
    }

    // Add role
    const role = interaction.guild.roles.cache.find(r => r.name === roleName);
    if (!role) {
      return interaction.reply({
        content: 'Rolul nu a fost gasit!',
        ephemeral: true,
      });
    }

    await member.roles.add(role);

    // Update database
    let user = await User.findOne({ userId: target.id, guildId: interaction.guild.id });
    if (!user) {
      user = await User.create({ userId: target.id, guildId: interaction.guild.id });
    }
    user.staffRole = roleName;
    await user.save();

    const embed = createEmbed({
      title: '👑 Staff Adaugat',
      description: `${target} a fost adaugat ca **${roleName}**!`,
      color: COLORS.success,
      fields: [
        { name: '👤 Utilizator', value: `${target}`, inline: true },
        { name: '🏷️ Rol', value: roleName, inline: true },
        { name: '👮 Adaugat de', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });

    // DM user
    try {
      const dmEmbed = createEmbed({
        title: '👑 Ai fost adaugat in Staff!',
        description: `Ai fost adaugat ca **${roleName}** pe **${interaction.guild.name}**!`,
        color: COLORS.success,
        fields: [
          { name: '🏷️ Rol', value: roleName, inline: true },
          { name: '👮 Adaugat de', value: interaction.user.tag, inline: true },
        ],
        timestamp: true,
      });

      await target.send({ embeds: [dmEmbed] });
    } catch (error) {
      logger.error(`Failed to DM user: ${error.message}`);
    }

    logger.info(`User ${target.tag} added as ${roleName} by ${interaction.user.tag}`);
  },

  async remove(interaction) {
    const target = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(target.id);

    // Remove staff roles
    const staffRoles = ['Helper', 'Moderator', 'Admin'];
    for (const roleName of staffRoles) {
      const role = interaction.guild.roles.cache.find(r => r.name === roleName);
      if (role && member.roles.cache.has(role.id)) {
        await member.roles.remove(role);
      }
    }

    // Update database
    let user = await User.findOne({ userId: target.id, guildId: interaction.guild.id });
    if (user) {
      user.staffRole = null;
      await user.save();
    }

    const embed = createEmbed({
      title: '👑 Staff Scos',
      description: `${target} a fost scos din staff!`,
      color: COLORS.danger,
      fields: [
        { name: '👤 Utilizator', value: `${target}`, inline: true },
        { name: '👮 Scos de', value: `${interaction.user}`, inline: true },
      ],
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });

    // DM user
    try {
      const dmEmbed = createEmbed({
        title: '👑 Ai fost scos din Staff',
        description: `Ai fost scos din staff pe **${interaction.guild.name}**!`,
        color: COLORS.danger,
        fields: [
          { name: '👮 Scos de', value: interaction.user.tag, inline: true },
        ],
        timestamp: true,
      });

      await target.send({ embeds: [dmEmbed] });
    } catch (error) {
      logger.error(`Failed to DM user: ${error.message}`);
    }

    logger.info(`User ${target.tag} removed from staff by ${interaction.user.tag}`);
  },

  async list(interaction) {
    const staffMembers = await User.find({
      guildId: interaction.guild.id,
      staffRole: { $exists: true, $ne: null },
    });

    if (staffMembers.length === 0) {
      return interaction.reply({
        content: 'Nu sunt staff members!',
        ephemeral: true,
      });
    }

    const embed = createEmbed({
      title: '👑 Staff Members',
      description: 'Lista staff members',
      color: COLORS.primary,
      fields: staffMembers.map(user => ({
        name: user.username || user.userId,
        value: `Rol: ${user.staffRole}`,
        inline: true,
      })),
      timestamp: true,
    });

    await interaction.reply({ embeds: [embed] });
  },
};
