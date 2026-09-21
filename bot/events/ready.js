const { Events, ActivityType } = require('discord.js');
const logger = require('../../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    
    client.user.setActivity(config.bot.activity, { type: ActivityType.Playing });
    client.user.setStatus('online');

    logger.info(`Greenville RP Bot is ready! Serving ${client.guilds.cache.size} guilds.`);
  },
};
