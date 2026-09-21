const Log = require('../database/models/Log');
const logger = require('./logger');

class LogService {
  static async log(guildId, type, { moderator = null, target = null, details = {} } = {}) {
    try {
      const logEntry = await Log.create({
        guildId,
        type,
        moderator,
        target,
        details,
      });
      return logEntry;
    } catch (error) {
      logger.error(`Failed to create log: ${error.message}`);
      return null;
    }
  }

  static async getLogs(guildId, { type = null, moderator = null, limit = 50, skip = 0 } = {}) {
    try {
      const query = { guildId };
      if (type) query.type = type;
      if (moderator) query.moderator = moderator;
      
      const logs = await Log.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);
      
      return logs;
    } catch (error) {
      logger.error(`Failed to fetch logs: ${error.message}`);
      return [];
    }
  }

  static async getRecentLogs(guildId, type, minutes = 30) {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);
      const logs = await Log.find({
        guildId,
        type,
        timestamp: { $gte: since },
      }).sort({ timestamp: -1 });
      
      return logs;
    } catch (error) {
      logger.error(`Failed to fetch recent logs: ${error.message}`);
      return [];
    }
  }
}

module.exports = LogService;
