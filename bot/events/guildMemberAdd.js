const { Events, EmbedBuilder } = require('discord.js');
const logger = require('../../utils/logger');
const User = require('../../database/models/User');
const config = require('../../config');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      // Create user in database
      let user = await User.findOne({ userId: member.id, guildId: member.guild.id });
      
      if (!user) {
        user = await User.create({
          userId: member.id,
          guildId: member.guild.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          avatar: member.user.avatarURL(),
          joinedAt: new Date(),
        });
      }

      // Auto-role
      if (config.roles?.unverified) {
        const unverifiedRole = member.guild.roles.cache.get(config.roles.unverified);
        if (unverifiedRole) {
          await member.roles.add(unverifiedRole);
        }
      }

      // Welcome message
      const welcomeChannel = member.guild.channels.cache.get(config.channels?.welcome);
      if (welcomeChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🎮 Bine ai venit pe Greenville RP!')
          .setDescription(`Bine ai venit ${member} pe serverul nostru!\n\nCiteste regulamentul si aplica pentru un departament daca doresti sa te alaturi echipei!`)
          .setColor('#FF6B00')
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .addFields(
            { name: '📋 Regulament', value: `Citeste regulamentul in <#${config.channels?.rules || 'N/A'}>`, inline: true },
            { name: '🏛️ Departamente', value: `Aplica in <#${config.channels?.applications || 'N/A'}>`, inline: true },
            { name: '👥 Membri', value: `${member.guild.memberCount}`, inline: true }
          )
          .setFooter({ text: 'Greenville RP Romania' })
          .setTimestamp();

        await welcomeChannel.send({ embeds: [embed] });
      }

      // Anti-raid check
      if (config.security.antiRaid) {
        const now = Date.now();
        const windowMs = config.security.raidWindowMinutes * 60 * 1000;
        
        if (!member.client.raidTracker.has(member.guild.id)) {
          member.client.raidTracker.set(member.guild.id, []);
        }
        
        const joins = member.client.raidTracker.get(member.guild.id);
        joins.push(now);
        
        // Remove old joins
        const recentJoins = joins.filter(t => now - t < windowMs);
        member.client.raidTracker.set(member.guild.id, recentJoins);
        
        if (recentJoins.length >= config.security.maxJoinsRaid) {
          // Raid detected
          logger.warn(`Raid detected in ${member.guild.name}! ${recentJoins.length} joins in ${config.security.raidWindowMinutes} minutes.`);
          
          const securityLog = member.guild.channels.cache.get(config.channels?.securityLog);
          if (securityLog) {
            securityLog.send({
              content: `🚨 **RAID DETECTAT!** ${recentJoins.length} useri au intrat in ultimele ${config.security.raidWindowMinutes} minute!`,
            });
          }
        }
      }

      // Auto-ban new accounts
      if (config.security.autoBanNewAccountDays > 0) {
        const accountAge = Date.now() - member.user.createdTimestamp;
        const daysOld = accountAge / (1000 * 60 * 60 * 24);
        
        if (daysOld < config.security.autoBanNewAccountDays) {
          try {
            await member.ban({ reason: `Cont nou (sub ${config.security.autoBanNewAccountDays} zile)` });
            logger.info(`Auto-banned ${member.user.tag} for new account (${daysOld.toFixed(1)} days old)`);
          } catch (error) {
            logger.error(`Failed to auto-ban ${member.user.tag}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      logger.error(`GuildMemberAdd error: ${error.message}`);
    }
  },
};
