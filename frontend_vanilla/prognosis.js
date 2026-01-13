/**
 * 🔮 THE ORACLE ENGINE (Prediction Loop)
 * Calculates long-term health trajectory based on daily habits.
 */
function predictFutureHealth(currentStats, dailyHabits, yearsToForecast = 5) {

    // 1. CONFIGURATION: The "Rules of Biology" (Simplified)
    const BIO_RULES = {
        LIVER: {
            recovery_rate: 0.8, // Recovers 0.8 health points per night
            damage_threshold: 40, // If health drops below 40, recovery slows down (scarring)
        },
        NEURO: {
            recovery_rate: 1.2,
            burnout_threshold: 30, // Below 30 = Chronic Fatigue
        },
        CARDIO: {
            recovery_rate: 0.5,
            hypertension_trigger: 60 // If stress > 60, BP rises
        }
    };

    // 2. INITIALIZATION
    let simulationDate = new Date();
    const totalDays = yearsToForecast * 365;

    // Clone stats
    let projectedHealth = { ...currentStats };

    let timeline = [];
    let riskFlags = [];

    // ---------------------------------------------------------
    // 3. THE PREDICTION LOOP
    // ---------------------------------------------------------
    for (let day = 1; day <= totalDays; day++) {

        // --- A. APPLY DAILY DAMAGE (Based on Habits) ---

        if (dailyHabits.caffeine_mg > 0) {
            // Formula: 100mg caffeine = 0.5 neuro stress (Accumulative)
            let stressLoad = (dailyHabits.caffeine_mg / 100) * 0.5;

            projectedHealth.neuro_health -= stressLoad;
            projectedHealth.cardio_health -= (stressLoad * 0.2);
        }

        if (dailyHabits.alcohol_units > 0) {
            let liverDmg = dailyHabits.alcohol_units * 2.5;
            projectedHealth.liver_health -= liverDmg;
        }

        // --- B. APPLY NIGHTLY RECOVERY ---

        // Liver Regeneration
        if (projectedHealth.liver_health > BIO_RULES.LIVER.damage_threshold) {
            projectedHealth.liver_health += BIO_RULES.LIVER.recovery_rate;
        } else {
            projectedHealth.liver_health += (BIO_RULES.LIVER.recovery_rate * 0.5);
        }

        // Neuro Reset (Sleep based)
        const sleepQuality = (dailyHabits.avg_sleep_hours || 7) / 8;
        projectedHealth.neuro_health += (BIO_RULES.NEURO.recovery_rate * sleepQuality);


        // --- C. CLAMP VALUES ---
        projectedHealth.liver_health = Math.min(Math.max(projectedHealth.liver_health, 0), 100);
        projectedHealth.neuro_health = Math.min(Math.max(projectedHealth.neuro_health, 0), 100);
        projectedHealth.cardio_health = Math.min(Math.max(projectedHealth.cardio_health, 0), 100);


        // --- D. CHECK FOR "BOOM" EVENTS ---

        if (day % 30 === 0) {
            simulationDate.setDate(simulationDate.getDate() + 30);
            const dateString = simulationDate.toISOString().split('T')[0];
            const year = Math.ceil(day / 365);

            // 1. Check Burnout
            if (projectedHealth.neuro_health < BIO_RULES.NEURO.burnout_threshold) {
                if (!riskFlags.some(r => r.type === "BURNOUT")) {
                    riskFlags.push({
                        date: dateString,
                        year: year,
                        type: "BURNOUT",
                        message: `⚠️ Neuro-Receptor Downregulation (Burnout) detected in Year ${year}.`
                    });
                }
            }

            // 2. Check Hypertension
            if (projectedHealth.cardio_health < 50) {
                if (!riskFlags.some(r => r.type === "HYPERTENSION")) {
                    riskFlags.push({
                        date: dateString,
                        year: year,
                        type: "HYPERTENSION",
                        message: `⚠️ Pre-Hypertension predicted in Year ${year} due to chronic stimulant use.`
                    });
                }
            }

            timeline.push({
                date: dateString,
                year: year,
                liver: parseFloat(projectedHealth.liver_health.toFixed(1)),
                neuro: parseFloat(projectedHealth.neuro_health.toFixed(1)),
                cardio: parseFloat(projectedHealth.cardio_health.toFixed(1))
            });
        }
    }

    return {
        graphData: timeline,
        risks: riskFlags,
        finalStatus: projectedHealth
    };
}
