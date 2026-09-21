const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  username: String,
  discriminator: String,
  avatar: String,
  joinedAt: Date,
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  credits: { type: Number, default: 100 },
  warns: { type: Number, default: 0 },
  warnHistory: [{
    reason: String,
    moderator: String,
    date: { type: Date, default: Date.now },
  }],
  isVerified: { type: Boolean, default: false },
  verificationData: {
    realName: String,
    age: Number,
    experience: String,
    motivation: String,
  },
  robloxId: Number,
  robloxUsername: String,
  robloxVerification: {
    code: String,
    robloxId: Number,
    robloxUsername: String,
    verified: { type: Boolean, default: false },
    createdAt: Date,
    verifiedAt: Date,
  },
  departments: {
    politie: { 
      active: { type: Boolean, default: false },
      rank: String,
      joinDate: Date,
    },
    pompieri: { 
      active: { type: Boolean, default: false },
      rank: String,
      joinDate: Date,
    },
    medic: { 
      active: { type: Boolean, default: false },
      rank: String,
      joinDate: Date,
    },
    dot: { 
      active: { type: Boolean, default: false },
      rank: String,
      joinDate: Date,
    },
  },
  applications: [{
    department: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'] },
    answers: Map,
    reviewedBy: String,
    reviewedAt: Date,
    createdAt: { type: Date, default: Date.now },
  }],
  activity: {
    messages: { type: Number, default: 0 },
    voiceMinutes: { type: Number, default: 0 },
    lastActive: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
userSchema.index({ guildId: 1, level: -1 });
userSchema.index({ guildId: 1, credits: -1 });

module.exports = mongoose.model('User', userSchema);
