const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../../utils/logger');
const Guild = require('../../../database/models/Guild');
const { createEmbed, COLORS } = require('../../../utils/embeds');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup complet pentru serverul Greenville RP')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      // Check permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({
          content: 'Nu ai permisiunea de a folosi aceasta comanda!',
          ephemeral: true,
        });
      }

      await interaction.deferReply();

      const guild = interaction.guild;
      const botMember = guild.members.me;

      // Progress embed
      const progressEmbed = createEmbed({
        title: '⚙️ Setup Server Greenville RP',
        description: 'Se configureaza serverul...\n\n⏳ Asteapta...',
        color: COLORS.primary,
        timestamp: true,
      });

      await interaction.editReply({ embeds: [progressEmbed] });

      // 1. Create Roles
      await updateProgress(interaction, '📦 Crearea rolurilor...');
      const roles = await createRoles(guild);

      // 2. Create Categories and Channels
      await updateProgress(interaction, '📁 Crearea categoriilor si canalelor...');
      const channels = await createChannels(guild, roles);

      // 3. Set Permissions
      await updateProgress(interaction, '🔒 Setarea permisiunilor...');
      await setPermissions(guild, roles, channels);

      // 4. Save to database
      await updateProgress(interaction, '💾 Salvarea configuratiei...');
      await saveGuildConfig(guild, roles, channels);

      // 5. Final
      const successEmbed = createEmbed({
        title: '✅ Setup Complet!',
        description: 'Serverul Greenville RP a fost configurat cu succes!\n\n**Ce s-a creat:**\n• 📦 Roluri pentru toate departamentele\n• 📁 Categorii si canale organizate\n• 🔒 Permisiuni configurate\n• 🎫 Sistem de tickete\n• ✅ Sistem de verificare\n• 🏛️ Panouri pentru departamente\n• 🔒 Sisteme de securitate\n\n**Urmatorii pasi:**\n1. Verifica canalele si rolurile\n2. Ajusteaza permisiunile daca este necesar\n3. Foloseste `/panels` pentru a crea panourile interactive\n4. Invita bot-ul si bucura-te de server!',
        color: COLORS.success,
        timestamp: true,
      });

      await interaction.editReply({ embeds: [successEmbed] });

      logger.info(`Server setup completed for ${guild.name} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Setup error: ${error.message}`);
      await interaction.editReply({
        content: `A aparut o eroare: ${error.message}`,
      });
    }
  },
};

async function updateProgress(interaction, message) {
  const embed = createEmbed({
    title: '⚙️ Setup Server Greenville RP',
    description: `Se configureaza serverul...\n\n${message}`,
    color: COLORS.primary,
    timestamp: true,
  });

  await interaction.editReply({ embeds: [embed] });
}

async function createRoles(guild) {
  const roles = {};

  // Staff roles
  const staffRoles = [
    { name: 'Founder', color: '#FF0000', permissions: [PermissionFlagsBits.Administrator] },
    { name: 'Co-Founder', color: '#FF4444', permissions: [PermissionFlagsBits.Administrator] },
    { name: 'Admin', color: '#FF6B00', permissions: [PermissionFlagsBits.Administrator] },
    { name: 'Moderator', color: '#FFD700', permissions: [PermissionFlagsBits.ManageMessages, PermissionFlagsBits.KickMembers, PermissionFlagsBits.BanMembers] },
    { name: 'Helper', color: '#00FF00', permissions: [PermissionFlagsBits.ManageMessages] },
  ];

  for (const roleData of staffRoles) {
    const role = await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      permissions: roleData.permissions,
      mentionable: true,
    });
    roles[roleData.name.toLowerCase()] = role.id;
  }

  // Member roles
  const memberRoles = [
    { name: 'Verified', color: '#00BFFF' },
    { name: 'Unverified', color: '#808080' },
    { name: 'Cetatean', color: '#FFFFFF' },
  ];

  for (const roleData of memberRoles) {
    const role = await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      mentionable: true,
    });
    roles[roleData.name.toLowerCase()] = role.id;
  }

  // Department roles
  for (const [key, dept] of Object.entries(config.greenville.departments)) {
    const role = await guild.roles.create({
      name: dept.name,
      color: dept.color,
      mentionable: true,
    });
    roles[key] = role.id;

    // Rank roles for department
    for (const rank of dept.ranks) {
      const rankRole = await guild.roles.create({
        name: `${dept.name} - ${rank}`,
        color: dept.color,
        mentionable: true,
      });
      roles[`${key}_${rank.toLowerCase().replace(/\s+/g, '_')}`] = rankRole.id;
    }
  }

  // Color roles
  const colors = [
    { name: 'Rosu', color: '#FF0000' },
    { name: 'Albastru', color: '#0000FF' },
    { name: 'Verde', color: '#00FF00' },
    { name: 'Galben', color: '#FFFF00' },
    { name: 'Portocaliu', color: '#FFA500' },
    { name: 'Mov', color: '#800080' },
    { name: 'Roz', color: '#FFC0CB' },
    { name: 'Alb', color: '#FFFFFF' },
  ];

  for (const colorData of colors) {
    const role = await guild.roles.create({
      name: `🎨 ${colorData.name}`,
      color: colorData.color,
      mentionable: false,
    });
    roles[`color_${colorData.name.toLowerCase()}`] = role.id;
  }

  // Notification roles
  const notifRoles = [
    { name: '📢 Anunturi', color: '#FF6B00' },
    { name: '🎉 Evenimente', color: '#FFD700' },
    { name: '🎁 Giveaway', color: '#FF00FF' },
    { name: '🔄 Update', color: '#00BFFF' },
  ];

  for (const roleData of notifRoles) {
    const role = await guild.roles.create({
      name: roleData.name,
      color: roleData.color,
      mentionable: true,
    });
    roles[`notif_${roleData.name.split(' ')[1].toLowerCase()}`] = role.id;
  }

  return roles;
}

async function createChannels(guild, roles) {
  const channels = {};
  const categories = config.greenville.categories;

  // Create categories
  for (const [key, name] of Object.entries(categories)) {
    const category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
    });
    channels[key] = category.id;
  }

  // Information channels
  const infoChannels = [
    { name: '📋 regulament', category: 'information' },
    { name: '📢 anunturi', category: 'information' },
    { name: '🎮 despre-server', category: 'information' },
    { name: '👥 membri', category: 'information' },
    { name: '📊 statistici', category: 'information' },
  ];

  for (const channelData of infoChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildText,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // Community channels
  const communityChannels = [
    { name: '💬 general', category: 'community' },
    { name: '🎮 roleplay', category: 'community' },
    { name: '📸 poze', category: 'community' },
    { name: '🎵 muzica', category: 'community' },
    { name: '🤖 comenzi-bot', category: 'community' },
  ];

  for (const channelData of communityChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildText,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // RP channels
  const rpChannels = [
    { name: '🚔 politie-chat', category: 'rp' },
    { name: '🚒 pompieri-chat', category: 'rp' },
    { name: '🚑 medic-chat', category: 'rp' },
    { name: '🚧 dot-chat', category: 'rp' },
    { name: '📻 radio-politie', category: 'rp' },
    { name: '📻 radio-pompieri', category: 'rp' },
    { name: '📻 radio-medic', category: 'rp' },
  ];

  for (const channelData of rpChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildText,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // Department channels
  const deptChannels = [
    { name: '📋 aplicatii-politie', category: 'departments' },
    { name: '📋 aplicatii-pompieri', category: 'departments' },
    { name: '📋 aplicatii-medic', category: 'departments' },
    { name: '📋 aplicatii-dot', category: 'departments' },
    { name: '📊 organizare-departamente', category: 'departments' },
  ];

  for (const channelData of deptChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildText,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // Voice channels
  const voiceChannels = [
    { name: '🔊 General', category: 'voice' },
    { name: '🔊 General 2', category: 'voice' },
    { name: '🔊 Gaming', category: 'voice' },
    { name: '🔊 Muzica', category: 'voice' },
    { name: '➕ Creaza Voce', category: 'voice' },
  ];

  for (const channelData of voiceChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildVoice,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // Staff channels
  const staffChannels = [
    { name: '👑 staff-chat', category: 'staff' },
    { name: '📋 moderare', category: 'staff' },
    { name: '📊 statistici-staff', category: 'staff' },
    { name: '🔐 securitate', category: 'staff' },
  ];

  for (const channelData of staffChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildText,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // Ticket channels
  const ticketChannels = [
    { name: '🎫 deschide-ticket', category: 'tickets' },
    { name: '📋 ticket-log', category: 'tickets' },
  ];

  for (const channelData of ticketChannels) {
    const channel = await guild.channels.create({
      name: channelData.name,
      type: ChannelType.GuildText,
      parent: channels[channelData.category],
    });
    channels[channelData.name.replace(/[^\w]/g, '')] = channel.id;
  }

  // Verification channel
  const verifyChannel = await guild.channels.create({
    name: '✅ verificare',
    type: ChannelType.GuildText,
    parent: channels.information,
  });
  channels.verificare = verifyChannel.id;

  return channels;
}

async function setPermissions(guild, roles, channels) {
  // Set default permissions for everyone
  const everyone = guild.roles.everyone;

  // Information channels - read only for everyone
  for (const [key, channelId] of Object.entries(channels)) {
    if (key.includes('informatii') || key.includes('regulament') || key.includes('anunturi') || key.includes('despre')) {
      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(everyone, {
          ViewChannel: true,
          SendMessages: false,
          ReadMessageHistory: true,
        });
      }
    }
  }

  // Staff channels - only staff can see
  for (const [key, channelId] of Object.entries(channels)) {
    if (key.includes('staff') || key.includes('moderare') || key.includes('securitate')) {
      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(everyone, {
          ViewChannel: false,
        });

        // Add staff roles
        for (const roleName of ['Founder', 'Co-Founder', 'Admin', 'Moderator', 'Helper']) {
          if (roles[roleName.toLowerCase()]) {
            await channel.permissionOverwrites.edit(roles[roleName.toLowerCase()], {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
            });
          }
        }
      }
    }
  }

  // Department channels - only department members can see
  for (const [key, channelId] of Object.entries(channels)) {
    if (key.includes('politie') || key.includes('pompieri') || key.includes('medic') || key.includes('dot')) {
      const channel = guild.channels.cache.get(channelId);
      if (channel) {
        await channel.permissionOverwrites.edit(everyone, {
          ViewChannel: false,
        });

        // Add department role
        if (key.includes('politie') && roles.politie) {
          await channel.permissionOverwrites.edit(roles.politie, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        } else if (key.includes('pompieri') && roles.pompieri) {
          await channel.permissionOverwrites.edit(roles.pompieri, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        } else if (key.includes('medic') && roles.medic) {
          await channel.permissionOverwrites.edit(roles.medic, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        } else if (key.includes('dot') && roles.dot) {
          await channel.permissionOverwrites.edit(roles.dot, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true,
          });
        }
      }
    }
  }

  // Ticket log - only staff
  const ticketLog = guild.channels.cache.get(channels.ticketlog);
  if (ticketLog) {
    await ticketLog.permissionOverwrites.edit(everyone, {
      ViewChannel: false,
    });

    for (const roleName of ['Founder', 'Co-Founder', 'Admin', 'Moderator']) {
      if (roles[roleName.toLowerCase()]) {
        await ticketLog.permissionOverwrites.edit(roles[roleName.toLowerCase()], {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        });
      }
    }
  }
}

async function saveGuildConfig(guild, roles, channels) {
  try {
    await Guild.findOneAndUpdate(
      { guildId: guild.id },
      {
        guildId: guild.id,
        guildName: guild.name,
        ownerId: guild.ownerId,
        channels,
        roles,
        settings: {
          prefix: '!',
          ticketEnabled: true,
          verificationEnabled: true,
          securityEnabled: true,
          antiRaid: true,
          antiSpam: true,
          antiNuke: true,
          autoBanNewAccounts: true,
        },
      },
      { upsert: true }
    );
  } catch (error) {
    logger.error(`Failed to save guild config: ${error.message}`);
  }
}
