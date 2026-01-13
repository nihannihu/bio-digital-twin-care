const { simulateStack } = require('./simulation_v2');

// Mock Data
const stack = [
    {
        drugName: "Caffeine",
        amountMg: 100,
        timeStr: "08:00",
        resolvedGenotypeData: {
            phenotype: "Slow Metabolizer",
            half_life_hours: 8,
            toxicity_risk: "Moderate"
        },
        weightKg: 70
    }
];

const kbMap = {
    "Caffeine": {
        drug: "Caffeine",
        v_d: 0.6,
        axis_effects: { neuro: 8, detox: 1, drug_load: 1 }
    }
};

try {
    console.log("Running Simulation...");
    const result = simulateStack(stack, kbMap);
    console.log("Timeline Length:", result.timeline.length);
    console.log("Risks Detected:", result.detectedRisks.length);
    console.log("Success!");
} catch (error) {
    console.error("Engine Crash:", error);
}
