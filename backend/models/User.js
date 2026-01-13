const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    weight_kg: {
        type: Number,
        required: true
    },
    genetics: {
        // Map gene variant IDs to Genotypes (e.g., "rs762551": "CC")
        type: Map,
        of: String
    },
    accumulated_stress: {
        liver_health: { type: Number, default: 95 },
        neuro_health: { type: Number, default: 85 },
        cardio_health: { type: Number, default: 90 }
    },
    current_status: {
        caffeine_level_mg: { type: Number, default: 0 },
        last_intake_time: { type: Date }
    }
});

module.exports = mongoose.model('User', UserSchema);
