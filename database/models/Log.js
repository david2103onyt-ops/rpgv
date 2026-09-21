const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  type: { type: String, required: true },
  moderator: String,
  target: String,
  details: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

logSchema.index({ guildId: 1, type: 1, timestamp: -1 });
logSchema.index({ guildId: 1, moderator: 1 });

module.exports = mongoose.model('Log', logSchema);
