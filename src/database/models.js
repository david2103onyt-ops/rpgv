const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    faction: { type: String, default: 'none' },
    totalShiftTime: { type: Number, default: 0 }, // in minutes
    totalSessionTime: { type: Number, default: 0 },
    applications: [{ type: String }],
    warnings: [{ date: Date, reason: String, staff: String }]
});

const SessionSchema = new mongoose.Schema({
    hostId: String,
    sessionName: String,
    robloxLink: String,
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    duration: Number,
    status: { type: String, default: 'active' }, // active, ended
    participants: {
        police: { type: Number, default: 0 },
        fire: { type: Number, default: 0 },
        dot: { type: Number, default: 0 },
        citizens: { type: Number, default: 0 }
    }
});

const ShiftSchema = new mongoose.Schema({
    userId: String,
    faction: String,
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    duration: Number
});

const ApplicationSchema = new mongoose.Schema({
    userId: String,
    faction: String,
    answers: { type: Map, of: String },
    status: { type: String, default: 'pending' }, // pending, accepted, rejected
    reviewedBy: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = {
    User: mongoose.model('User', UserSchema),
    Session: mongoose.model('Session', SessionSchema),
    Shift: mongoose.model('Shift', ShiftSchema),
    Application: mongoose.model('Application', ApplicationSchema)
};
