const { Events } = require('discord.js');
const logger = require('../../utils/logger');
const User = require('../../database/models/User');
const config = require('../../config');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Anti-spam
    if (config.security.maxMessagesPerSecond > 0) {
      const now = Date.now();
      const userId = message.author.id;
      
      if (!message.client.messageTracker.has(userId)) {
        message.client.messageTracker.set(userId, []);
      }
      
      const timestamps = message.client.messageTracker.get(userId);
      timestamps.push(now);
      
      // Remove old timestamps
      const recentTimestamps = timestamps.filter(t => now - t < 1000);
      message.client.messageTracker.set(userId, recentTimestamps);
      
      if (recentTimestamps.length > config.security.maxMessagesPerSecond) {
        try {
          await message.delete();
          await message.channel.send({
            content: `${message.author}, nu spam!`,
            deleteAfter: 3000,
          });
        } catch (error) {
          // Message already deleted
        }
        return;
      }
    }

    // XP system
    try {
      let user = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
      
      if (!user) {
        user = await User.create({
          userId: message.author.id,
          guildId: message.guild.id,
          username: message.author.username,
          discriminator: message.author.discriminator,
          avatar: message.author.avatarURL(),
        });
      }

      // XP gain with cooldown
      const now = Date.now();
      if (!user._lastXpTime || now - user._lastXpTime > 60000) {
        const xpGain = Math.floor(Math.random() * 10) + 5;
        user.xp += xpGain;
        
        // Check level up
        const xpNeeded = user.level * 100 + 100;
        if (user.xp >= xpNeeded) {
          user.level += 1;
          user.xp = 0;
          
          // Level up notification
          const levelChannel = message.guild.channels.cache.get(config.channels?.levelChannel);
          if (levelChannel) {
            levelChannel.send({
              content: `🎉 ${message.author} a urcat la nivelul **${user.level}**!`,
            });
          }
        }
        
        user._lastXpTime = now;
        await user.save();
      }

      // Update activity
      user.activity.messages += 1;
      user.activity.lastActive = new Date();
      await user.save();
    } catch (error) {
      logger.error(`XP system error: ${error.message}`);
    }

    // Custom commands
    if (message.content.startsWith(config.bot.prefix)) {
      const args = message.content.slice(config.bot.prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();
      
      // Handle custom commands here if needed
    }
  },
};
