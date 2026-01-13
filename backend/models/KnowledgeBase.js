const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
    drug: { type: String, required: true, unique: true },
    type: { type: String, enum: ['Stimulant', 'Depressant', 'Analgesic', 'Other'] },
    gene: { type: String, required: true }, // Primary metabolizer gene
    variant_id: { type: String, required: true },

    // Pharmacokinetics
    v_d: { type: Number, default: 0.6 }, // Volume of distribution (L/kg)
    absorption_lag: { type: Number, default: 0.5 }, // Time to peak (hours)

    // Genetic Rules
    genotypes: {
        type: Map,
        of: new mongoose.Schema({
            phenotype: String,
            half_life_hours: Number,
            clearance_modifier: { type: Number, default: 1.0 }, // 1.0 = Normal, 0.5 = Slow
            toxicity_risk: String,
            description: String
        }, { _id: false })
    },

    // Sandbox Body: Multi-Axis Effects
    axis_effects: {
        neuro: { type: Number, default: 0 }, // +10 = Wired, -10 = Sedated
        detox: { type: Number, default: 0 }, // Liver load cost
        drug_load: { type: Number, default: 0 } // General systemic load
    },

    // Risks & Thresholds
    thresholds: {
        sleep_disruption: { type: Number, default: 10 }, // mg level that stops sleep
        liver_toxicity: { type: Number, default: 4000 }, // mg/24h limit
        lethal: { type: Number, default: 10000 }
    }
});

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
