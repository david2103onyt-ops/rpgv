const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, required: true },
  level: { type: Number, default: 1 },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

warnSchema.index({ guildId: 1, userId: 1, active: 1 });

module.exports = mongoose.model('Warn', warnSchema);
