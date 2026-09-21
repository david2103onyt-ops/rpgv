const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  creatorId: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['support', 'report', 'department', 'appeal', 'other'],
    default: 'support' 
  },
  tier: { 
    type: Number, 
    enum: [1, 2, 3],
    default: 1 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium' 
  },
  status: { 
    type: String, 
    enum: ['open', 'claimed', 'closed', 'archived'],
    default: 'open' 
  },
  claimedBy: String,
  closedBy: String,
  closedAt: Date,
  transcript: String,
  messages: [{
    author: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ticketSchema.index({ guildId: 1, status: 1 });
ticketSchema.index({ guildId: 1, creatorId: 1 });
ticketSchema.index({ channelId: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
