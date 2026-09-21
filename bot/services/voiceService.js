const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const VoiceRoom = require('../../database/models/VoiceRoom');
const logger = require('../../utils/logger');
const { createEmbed, COLORS, createActionRow, createButton } = require('../../utils/embeds');

class VoiceService {
  static async createTempVoice(state) {
    try {
      const guild = state.guild;
      const member = state.member;

      // Create voice channel
      const channel = await guild.channels.create({
        name: `🔊 ${member.user.username}`,
        type: ChannelType.GuildVoice,
        parent: state.channel.parent,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
            ],
          },
        ],
      });

      // Move user to new channel
      await member.voice.setChannel(channel);

      // Save to database
      await VoiceRoom.create({
        guildId: guild.id,
        channelId: channel.id,
        ownerId: member.id,
        name: channel.name,
      });

      // Create control panel
      await this.createControlPanel(channel, member);

      logger.info(`Created temp voice: ${channel.name} for ${member.user.tag}`);
    } catch (error) {
      logger.error(`Failed to create temp voice: ${error.message}`);
    }
  }

  static async createControlPanel(channel, owner) {
    try {
      const embed = createEmbed({
        title: `🔊 ${channel.name}`,
        description: `**Proprietar:** ${owner}\n\nFoloseste butoanele de mai jos pentru a gestiona camera!`,
        color: COLORS.primary,
        timestamp: true,
      });

      const buttons = createActionRow([
        createButton({ customId: 'voice_lock', label: 'Lock', style: ButtonStyle.Secondary, emoji: '🔒' }),
        createButton({ customId: 'voice_hide', label: 'Hide', style: ButtonStyle.Secondary, emoji: '👁️' }),
        createButton({ customId: 'voice_rename', label: 'Rename', style: ButtonStyle.Secondary, emoji: '✏️' }),
        createButton({ customId: 'voice_limit', label: 'Limit', style: ButtonStyle.Secondary, emoji: '👥' }),
        createButton({ customId: 'voice_kick', label: 'Kick', style: ButtonStyle.Danger, emoji: '👢' }),
      ]);

      const textChannel = await channel.guild.channels.create({
        name: `chat-${owner.user.username}`,
        type: ChannelType.GuildText,
        parent: channel.parent,
        permissionOverwrites: [
          {
            id: channel.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: owner.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
            ],
          },
        ],
      });

      await textChannel.send({ embeds: [embed], components: [buttons] });
    } catch (error) {
      logger.error(`Failed to create control panel: ${error.message}`);
    }
  }

  static async handleButton(interaction) {
    const { customId, member, guild, channel } = interaction;

    const voiceRoom = await VoiceRoom.findOne({ channelId: channel.id });
    if (!voiceRoom) {
      return interaction.reply({
        content: 'Aceasta nu este o camera vocala temporara!',
        ephemeral: true,
      });
    }

    if (voiceRoom.ownerId !== member.id) {
      return interaction.reply({
        content: 'Doar proprietarul camerei poate folosi aceste butoane!',
        ephemeral: true,
      });
    }

    switch (customId) {
      case 'voice_lock':
        await this.toggleLock(interaction, voiceRoom);
        break;
      case 'voice_hide':
        await this.toggleHide(interaction, voiceRoom);
        break;
      case 'voice_rename':
        await this.renameChannel(interaction, voiceRoom);
        break;
      case 'voice_limit':
        await this.setUserLimit(interaction, voiceRoom);
        break;
      case 'voice_kick':
        await this.kickUser(interaction, voiceRoom);
        break;
    }
  }

  static async toggleLock(interaction, voiceRoom) {
    try {
      voiceRoom.locked = !voiceRoom.locked;
      await voiceRoom.save();

      const voiceChannel = interaction.guild.channels.cache.get(voiceRoom.channelId);
      if (voiceChannel) {
        if (voiceRoom.locked) {
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
            Connect: false,
          });
        } else {
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
            Connect: true,
          });
        }
      }

      const status = voiceRoom.locked ? 'blocata' : 'deblocata';
      const emoji = voiceRoom.locked ? '🔒' : '🔓';

      const embed = createEmbed({
        title: `${emoji} Camera ${status}`,
        description: `Camera vocala a fost ${status}!`,
        color: voiceRoom.locked ? COLORS.danger : COLORS.success,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to toggle lock: ${error.message}`);
    }
  }

  static async toggleHide(interaction, voiceRoom) {
    try {
      voiceRoom.hidden = !voiceRoom.hidden;
      await voiceRoom.save();

      const voiceChannel = interaction.guild.channels.cache.get(voiceRoom.channelId);
      if (voiceChannel) {
        if (voiceRoom.hidden) {
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
            ViewChannel: false,
          });
        } else {
          await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
            ViewChannel: true,
          });
        }
      }

      const status = voiceRoom.hidden ? 'ascunsa' : 'vizibila';
      const emoji = voiceRoom.hidden ? '👁️' : '👁️‍🗨️';

      const embed = createEmbed({
        title: `${emoji} Camera ${status}`,
        description: `Camera vocala a devenit ${status}!`,
        color: voiceRoom.hidden ? COLORS.danger : COLORS.success,
        timestamp: true,
      });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to toggle hide: ${error.message}`);
    }
  }

  static async renameChannel(interaction, voiceRoom) {
    try {
      // Show modal for rename
      const modal = new (require('discord.js').ModalBuilder)()
        .setCustomId('modal_rename_voice')
        .setTitle('Redenumeste Camera')
        .addComponents(
          new (require('discord.js').ActionRowBuilder)().addComponents(
            new (require('discord.js').TextInputBuilder)()
              .setCustomId('new_name')
              .setLabel('Noul Nume')
              .setStyle(require('discord.js').TextInputStyle.Short)
              .setPlaceholder('Introdu noul nume...')
              .setRequired(true)
              .setMaxLength(100)
          )
        );

      await interaction.showModal(modal);

      const filter = (i) => i.customId === 'modal_rename_voice' && i.user.id === interaction.user.id;
      const modalInteraction = await interaction.awaitModalSubmit({ filter, time: 30000 });

      const newName = modalInteraction.fields.getTextInputValue('new_name');

      const voiceChannel = interaction.guild.channels.cache.get(voiceRoom.channelId);
      if (voiceChannel) {
        await voiceChannel.setName(newName);
        voiceRoom.name = newName;
        await voiceRoom.save();
      }

      const embed = createEmbed({
        title: '✏️ Camera Redenumita',
        description: `Camera a fost redenumita in **${newName}**!`,
        color: COLORS.success,
        timestamp: true,
      });

      await modalInteraction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to rename channel: ${error.message}`);
    }
  }

  static async setUserLimit(interaction, voiceRoom) {
    try {
      // Show select menu for limit
      const selectMenu = new (require('discord.js').StringSelectMenuBuilder)()
        .setCustomId('select_voice_limit')
        .setPlaceholder('Selecteaza limita...')
        .addOptions([
          { label: 'Fara Limita', value: '0', emoji: '♾️' },
          { label: '2 Utilizatori', value: '2', emoji: '2️⃣' },
          { label: '3 Utilizatori', value: '3', emoji: '3️⃣' },
          { label: '5 Utilizatori', value: '5', emoji: '5️⃣' },
          { label: '10 Utilizatori', value: '10', emoji: '🔟' },
        ]);

      const row = new (require('discord.js').ActionRowBuilder)().addComponents(selectMenu);

      await interaction.reply({ components: [row], ephemeral: true });

      const filter = (i) => i.customId === 'select_voice_limit' && i.user.id === interaction.user.id;
      const selectInteraction = await interaction.awaitMessageComponent({ filter, time: 30000 });

      const limit = parseInt(selectInteraction.values[0]);

      const voiceChannel = interaction.guild.channels.cache.get(voiceRoom.channelId);
      if (voiceChannel) {
        await voiceChannel.setUserLimit(limit || null);
        voiceRoom.userLimit = limit;
        await voiceRoom.save();
      }

      const limitText = limit === 0 ? 'Fara limita' : `${limit} utilizatori`;

      const embed = createEmbed({
        title: '👥 Limita Setata',
        description: `Limita camerei a fost setata la **${limitText}**!`,
        color: COLORS.success,
        timestamp: true,
      });

      await selectInteraction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to set user limit: ${error.message}`);
    }
  }

  static async kickUser(interaction, voiceRoom) {
    try {
      // Show select menu with users in voice channel
      const voiceChannel = interaction.guild.channels.cache.get(voiceRoom.channelId);
      if (!voiceChannel) return;

      const members = voiceChannel.members.filter(m => m.id !== voiceRoom.ownerId);
      if (members.size === 0) {
        return interaction.reply({
          content: 'Nu sunt alti utilizatori in camera!',
          ephemeral: true,
        });
      }

      const selectMenu = new (require('discord.js').StringSelectMenuBuilder)()
        .setCustomId('select_voice_kick')
        .setPlaceholder('Selecteaza utilizatorul...')
        .addOptions(members.map(m => ({
          label: m.user.username,
          value: m.id,
          emoji: '👤',
        })));

      const row = new (require('discord.js').ActionRowBuilder)().addComponents(selectMenu);

      await interaction.reply({ components: [row], ephemeral: true });

      const filter = (i) => i.customId === 'select_voice_kick' && i.user.id === interaction.user.id;
      const selectInteraction = await interaction.awaitMessageComponent({ filter, time: 30000 });

      const targetId = selectInteraction.values[0];
      const targetMember = await interaction.guild.members.fetch(targetId);

      // Move user to AFK channel or disconnect
      if (interaction.guild.afkChannel) {
        await targetMember.voice.setChannel(interaction.guild.afkChannel);
      } else {
        await targetMember.voice.disconnect();
      }

      const embed = createEmbed({
        title: '👢 Utilizator Kicked',
        description: `${targetMember} a fost scos din camera!`,
        color: COLORS.danger,
        timestamp: true,
      });

      await selectInteraction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error(`Failed to kick user: ${error.message}`);
    }
  }
}

module.exports = VoiceService;
