const mongoose = require('mongoose');

const voiceRoomSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  ownerId: { type: String, required: true },
  name: String,
  locked: { type: Boolean, default: false },
  hidden: { type: Boolean, default: false },
  userLimit: { type: Number, default: 0 },
  bannedUsers: [String],
  allowedUsers: [String],
  createdAt: { type: Date, default: Date.now },
});

voiceRoomSchema.index({ guildId: 1, ownerId: 1 });

module.exports = mongoose.model('VoiceRoom', voiceRoomSchema);
