const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  ownerId: { type: String, required: true },
  ownerUsername: String,
  robloxId: Number,
  robloxUsername: String,
  plate: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: Number,
  color: String,
  colorHex: String,
  category: { 
    type: String, 
    enum: ['sedan', 'suv', 'sports', 'truck', 'motorcycle', 'van', 'bus', 'emergency', 'other'],
    default: 'sedan' 
  },
  engine: String,
  transmission: { 
    type: String, 
    enum: ['manual', 'automatic'],
    default: 'automatic' 
  },
  fuelType: { 
    type: String, 
    enum: ['gasoline', 'diesel', 'electric', 'hybrid'],
    default: 'gasoline' 
  },
  mileage: { type: Number, default: 0 },
  insurance: {
    active: { type: Boolean, default: false },
    expiresAt: Date,
    type: { type: String, enum: ['basic', 'full', 'premium'], default: 'basic' },
  },
  status: { 
    type: String, 
    enum: ['active', 'stolen', 'impounded', 'scrapped'],
    default: 'active' 
  },
  history: [{
    action: String,
    by: String,
    date: { type: Date, default: Date.now },
    details: String,
  }],
  registeredAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

carSchema.index({ guildId: 1, ownerId: 1 });
carSchema.index({ guildId: 1, plate: 1 }, { unique: true });
carSchema.index({ guildId: 1, robloxId: 1 });

module.exports = mongoose.model('Car', carSchema);
