const fs = require('fs');
const path = require('path');

function simulateStack(stack, kbMap) {
    console.log("SimulateStack Started. Items:", stack.length);

    // 1. Initialize Timeline
    const timeline = [];
    for (let i = 0; i <= 48; i++) {
        const hour = i / 2;
        timeline.push({
            time_hour: hour,
            time_label: formatTime(hour),
            active_substances: {},
            axes: { neuro: 0, detox: 0, drug_load: 0 },
            events: []
        });
    }

    const detectedRisks = [];

    // 2. Process Stack
    stack.forEach((item, index) => {
        console.log(`Processing Item ${index}: ${item.drugName}`);

        const drugKB = kbMap[item.drugName];
        if (!drugKB) {
            console.log(`KB entry not found for ${item.drugName}`);
            return;
        }

        const genotypeData = item.resolvedGenotypeData;
        if (!genotypeData) {
            console.log(`Genotype data missing for ${item.drugName}`);
            return;
        }

        console.log(`Genotype Found: ${genotypeData.phenotype}, HalfLife: ${genotypeData.half_life_hours}`);

        const halfLife = genotypeData.half_life_hours || 4;
        const Vd = drugKB.v_d || 0.6;
        const amountMg = parseFloat(item.amountMg);

        if (isNaN(amountMg)) {
            console.log("Invalid Amount:", item.amountMg);
            return;
        }

        const kel = Math.log(2) / halfLife;
        const C0 = amountMg / (Vd * 70);

        // Start Time Parse
        // item.timeStr "08:00"
        const parts = (item.timeStr || "00:00").split(':');
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        const startTime = h + (m / 60);

        console.log(`Start Time: ${startTime}, Kel: ${kel}, C0: ${C0}`);

        // Timeline Loop
        timeline.forEach(slot => {
            if (slot.time_hour >= startTime) {
                const t_delta = slot.time_hour - startTime;

                const concentration = C0 * Math.exp(-kel * t_delta);
                const amountRemaining = concentration * (Vd * 70);

                if (amountRemaining > 0.5) {
                    slot.active_substances[item.drugName] = (slot.active_substances[item.drugName] || 0) + amountRemaining;

                    const loadFactor = amountRemaining / amountMg;

                    // access axis_effects safely
                    const effects = drugKB.axis_effects || { neuro: 0, detox: 0, drug_load: 0 };

                    slot.axes.neuro += ((effects.neuro || 0) * loadFactor);
                    slot.axes.detox += ((effects.detox || 0) * loadFactor);
                    slot.axes.drug_load += ((effects.drug_load || 0) * loadFactor);
                }
            }
        });
    });

    // 3. Risks
    timeline.forEach(slot => {
        if (slot.time_hour === 23 && slot.axes.neuro > 2) {
            detectedRisks.push({
                type: "Sleep Disruption",
                time: "11:00 PM",
                message: "High stimulant activity.",
                severity: "High"
            });
            slot.events.push("⚠️ Sleep Risks");
        }
    });

    console.log("Simulation Complete. Risks:", detectedRisks.length);
    return { timeline, detectedRisks };
}

function formatTime(decimalTime) {
    const hours = Math.floor(decimalTime);
    const minutes = Math.floor((decimalTime - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const fHours = hours % 12 || 12;
    const fMin = minutes < 10 ? '0' + minutes : minutes;
    return `${fHours}:${fMin} ${ampm}`;
}

module.exports = { simulateStack };
