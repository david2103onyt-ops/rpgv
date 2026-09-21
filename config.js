require('dotenv').config();

const config = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    guildId: process.env.GUILD_ID,
  },
  bot: {
    prefix: process.env.BOT_PREFIX || '!',
    status: process.env.BOT_STATUS || 'Greenville RP Romania',
    activity: process.env.BOT_ACTIVITY || 'playing',
  },
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/greenville_rp',
  },
  dashboard: {
    url: process.env.DASHBOARD_URL || 'http://localhost:3000',
    port: parseInt(process.env.DASHBOARD_PORT) || 3000,
    sessionSecret: process.env.SESSION_SECRET || 'default_secret',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default_encryption_key_32chars!',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
  verification: {
    channel: process.env.VERIFICATION_CHANNEL,
    logChannel: process.env.VERIFICATION_LOG_CHANNEL,
    verifiedRole: process.env.VERIFIED_ROLE,
    unverifiedRole: process.env.UNVERIFIED_ROLE,
  },
  tickets: {
    category: process.env.TICKET_CATEGORY,
    logChannel: process.env.TICKET_LOG_CHANNEL,
    staffRoles: process.env.TICKET_STAFF_ROLES ? process.env.TICKET_STAFF_ROLES.split(',') : [],
  },
  security: {
    maxJoinsPerMinute: parseInt(process.env.MAX_JOINS_PER_MINUTE) || 5,
    maxMessagesPerSecond: parseInt(process.env.MAX_MESSAGES_PER_SECOND) || 3,
    maxMentionsPerMessage: parseInt(process.env.MAX_MENTIONS_PER_MESSAGE) || 5,
    maxLinksPerMessage: parseInt(process.env.MAX_LINKS_PER_MESSAGE) || 3,
    maxJoinsRaid: parseInt(process.env.MAX_JOINS_RAID) || 10,
    raidWindowMinutes: parseInt(process.env.RAID_WINDOW_MINUTES) || 5,
    autoBanNewAccountDays: parseInt(process.env.AUTO_BAN_NEW_ACCOUNT_DAYS) || 7,
  },
  backup: {
    dir: process.env.BACKUP_DIR || './backups',
    autoInterval: parseInt(process.env.BACKUP_AUTO_INTERVAL) || 24,
  },
  ownerIds: process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [],
  staffRoleIds: process.env.STAFF_ROLE_IDS ? process.env.STAFF_ROLE_IDS.split(',') : [],

  // Greenville RP specific config
  greenville: {
    departments: {
      politie: {
        name: 'Politie',
        color: '#0000FF',
        icon: '🚔',
        ranks: ['Cetatean', 'Agent', 'Agent Sef', 'Subinspector', 'Inspector', 'Comisar', 'Seft Politie'],
      },
      pompieri: {
        name: 'Pompieri',
        color: '#FF0000',
        icon: '🚒',
        ranks: ['Cetatean', 'Pompier', 'Pompier Sef', 'Subofiter', 'Ofiter', 'Director Pompieri'],
      },
      medic: {
        name: 'Medic',
        color: '#00FF00',
        icon: '🚑',
        ranks: ['Cetatean', 'Paramedic', 'Medic', 'Medic Sef', 'Director Medical'],
      },
      dot: {
        name: 'DOT (Departamentul Transporturilor)',
        color: '#FFA500',
        icon: '🚧',
        ranks: ['Cetatean', 'Inspector', 'Inspector Sef', 'Director DOT'],
      },
    },
    categories: {
      information: '📚 INFORMATII',
      community: '💬 COMUNITATE',
      rp: '🎮 ROLEPLAY',
      departments: '🏛️ DEPARTAMENTE',
      voice: '🔊 VOCE',
      staff: '👑 STAFF',
      tickets: '🎫 TICKETE',
      security: '🔒 SECURITATE',
    },
  },
};

module.exports = config;
