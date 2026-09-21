const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  department: { 
    type: String, 
    enum: ['politie', 'pompieri', 'medic', 'dot'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'approved', 'rejected'],
    default: 'pending' 
  },
  answers: {
    experience: String,
    motivation: String,
    availability: String,
    scenarios: String,
    additionalInfo: String,
  },
  reviewedBy: String,
  reviewNote: String,
  reviewedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

applicationSchema.index({ guildId: 1, userId: 1, department: 1 });
applicationSchema.index({ guildId: 1, status: 1 });
applicationSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Application', applicationSchema);
