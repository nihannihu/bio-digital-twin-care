const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        index: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    substance: {
        type: String,
        required: true
    },
    dose_mg: {
        type: Number,
        required: true
    },
    source: {
        type: String
    },
    impact_metrics: {
        liver_strain_added: { type: Number, default: 0 },
        neuro_stimulation: { type: Number, default: 0 }
    }
});

module.exports = mongoose.model('DailyLog', DailyLogSchema);
