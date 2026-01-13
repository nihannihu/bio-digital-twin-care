const fs = require('fs');
const path = require('path');

// Load Knowledge Base
const knowledgeBase = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge_base.json'), 'utf8'));

/**
 * Calculates current caffeine concentration based on First-Order Elimination Kinetics
 * @param {number} doseMg - Initial dose in mg
 * @param {number} weightKg - User weight in kg
 * @param {string} genotype - User genotype (AA, AC, or CC)
 * @param {string} startTimeStr - Time of ingestion (e.g., "08:00")
 * @returns {Array} Time-series data of concentration
 */
function calculateClearance(doseMg, weightKg, genotype, startTimeStr) {
    // 1. Get Genotype Data
    const genData = knowledgeBase.genotypes[genotype];
    if (!genData) {
        throw new Error(`Invalid Genotype: ${genotype}`);
    }

    const halfLife = genData.half_life_hours;

    // 2. Constants
    // Elimination Rate Constant (kel)
    const k_el = Math.log(2) / halfLife;

    // Volume of Distribution (Vd) approx 0.6 L/kg
    const V_d = 0.6 * weightKg;

    // Initial Concentration (C0)
    const C_0 = doseMg / V_d;

    // 3. Simulation Loop (Generate curve for 24 hours)
    const timeSeries = [];
    const [startHour, startMinute] = startTimeStr.split(':').map(Number);
    let currentHour = startHour;

    // Simulate for 24 hours post-ingestion
    for (let t = 0; t <= 24; t++) {
        // Calculate concentration at time t (hours passed)
        // Formula: Ct = C0 * e^(-kel * t)
        const concentration = C_0 * Math.exp(-k_el * t);
        const amountRemaining = concentration * V_d;

        // Format time string
        const displayHour = (currentHour + t) % 24;
        const ampm = displayHour >= 12 ? 'PM' : 'AM';
        const formattedHour = displayHour % 12 || 12; // Convert 0 to 12
        const timeLabel = `${formattedHour}:00 ${ampm}`;

        const isCleared = amountRemaining < 10; // Threshold: 10mg

        timeSeries.push({
            time_hours_passed: t,
            time_label: timeLabel,
            concentration_mg_L: parseFloat(concentration.toFixed(2)),
            amount_remaining_mg: parseFloat(amountRemaining.toFixed(2)),
            status: isCleared ? 'Cleared' : 'Active'
        });

        // Break if effectively zero
        if (amountRemaining < 0.1) break;
    }

    return {
        phenotype: genData.phenotype,
        half_life: halfLife,
        recommendation: genData.recommendation,
        curve: timeSeries
    };
}

// Example Usage (for testing)
if (require.main === module) {
    try {
        const result = calculateClearance(65, 70, "CC", "08:00");
        console.log("Phenotype:", result.phenotype);
        console.log("Recommendation:", result.recommendation);
        console.log("Crash Curve (First 5 hours):");
        console.table(result.curve.slice(0, 5));
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = { calculateClearance };
