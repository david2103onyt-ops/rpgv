const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const LogService = require('../../utils/LogService');
const config = require('../../config');

async function logEvent(guild, type, details) {
  try {
    await LogService.log(guild.id, type, { details });
    
    const logChannel = guild.channels.cache.get(config.channels?.modLog);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`📝 ${type.replace(/_/g, ' ').toUpperCase()}`)
        .setColor('#FF6B00')
        .addFields(
          Object.entries(details).map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value: String(value).substring(0, 1024),
            inline: true,
          }))
        )
        .setTimestamp();
      
      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    logger.error(`Failed to log event: ${error.message}`);
  }
}

module.exports = {
  name: Events.ChannelCreate,
  execute(channel) {
    if (!channel.guild) return;
    logEvent(channel.guild, 'channel_create', { channel: channel.name, id: channel.id });
  },
};
