const { Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const logger = require('../../utils/logger');
const VoiceRoom = require('../../database/models/VoiceRoom');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) => {
    try {
      // User joined a voice channel
      if (!oldState.channel && newState.channel) {
        // Check if it's a temp voice trigger channel
        if (newState.channel.name === '➕ Creaza Voce') {
          await createTempVoice(newState);
        }
      }

      // User left a voice channel
      if (oldState.channel && !newState.channel) {
        // Check if the channel is empty and should be deleted
        if (oldState.channel.members.size === 0) {
          const voiceRoom = await VoiceRoom.findOne({ channelId: oldState.channel.id });
          if (voiceRoom) {
            try {
              await oldState.channel.delete();
              await VoiceRoom.deleteOne({ channelId: oldState.channel.id });
              logger.info(`Deleted empty temp voice: ${oldState.channel.name}`);
            } catch (error) {
              logger.error(`Failed to delete temp voice: ${error.message}`);
            }
          }
        }
      }

      // User moved between channels
      if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
        // Check if old channel is empty
        if (oldState.channel.members.size === 0) {
          const voiceRoom = await VoiceRoom.findOne({ channelId: oldState.channel.id });
          if (voiceRoom) {
            try {
              await oldState.channel.delete();
              await VoiceRoom.deleteOne({ channelId: oldState.channel.id });
              logger.info(`Deleted empty temp voice: ${oldState.channel.name}`);
            } catch (error) {
              logger.error(`Failed to delete temp voice: ${error.message}`);
            }
          }
        }
      }
    } catch (error) {
      logger.error(`VoiceStateUpdate error: ${error.message}`);
    }
  },
};

async function createTempVoice(state) {
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

    logger.info(`Created temp voice: ${channel.name} for ${member.user.tag}`);
  } catch (error) {
    logger.error(`Failed to create temp voice: ${error.message}`);
  }
}
