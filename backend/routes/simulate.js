const express = require('express');
const router = express.Router();
const { calculateClearance } = require('../simulation');
const KnowledgeBase = require('../models/KnowledgeBase');
const User = require('../models/User');

// GET /drugs - List all available drugs
router.get('/drugs', async (req, res) => {
    try {
        const drugs = await KnowledgeBase.find({}, 'drug type');
        res.json(drugs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /simulate
router.post('/simulate', async (req, res) => {
    try {
        const { drug, amount_mg, time, userId } = req.body; // Changed genotype -> userId

        // 1. Fetch User Data
        // Use default ID 'nihan_001' if not provided for now
        const effectiveUserId = userId || "nihan_001";
        const user = await User.findOne({ user_id: effectiveUserId });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Fetch Knowledge Base for Drug
        // For MVP we assume we are looking for CYP1A2 / Caffeine
        const kb = await KnowledgeBase.findOne({ drug: "Caffeine" }); // TODO: Match dynamic drug names
        if (!kb) {
            return res.status(404).json({ error: "Drug data not found in Knowledge Base" });
        }

        // 3. Determine Genotype
        // Look up user's variant for the gene in KB
        const geneVariant = kb.variant_id; // e.g. rs762551
        const userGenotype = user.genetics.get(geneVariant); // e.g. "CC"

        if (!userGenotype) {
            return res.status(400).json({ error: `Genotype data for ${geneVariant} missing for user` });
        }

        // 4. Run Simulation
        const result = calculateClearance(amount_mg, user.weight_kg, userGenotype, time);

        // Calculate Crash Time (first time amount drops below 10mg)
        const crashPoint = result.curve.find(point => point.amount_remaining_mg < 10);
        const crashTime = crashPoint ? crashPoint.time_label : "More than 24h";

        res.json({
            success: true,
            drug: drug || "Caffeine",
            genotype: userGenotype,
            phenotype: result.phenotype,
            recommendation: result.recommendation,
            crash_time: crashTime,
            simulation_data: result.curve
        });

    } catch (error) {
        console.error("Simulation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

const DailyLog = require('../models/DailyLog');

// POST /log - Save a daily log
router.post('/log', async (req, res) => {
    try {
        const { user_id, date, substance, dose_mg, source, impact_metrics } = req.body;

        const newLog = await DailyLog.create({
            user_id: user_id || "nihan_001",
            date: date || new Date().toISOString().split('T')[0],
            substance,
            dose_mg,
            source: source || substance,
            impact_metrics: impact_metrics || {}
        });

        res.json({ success: true, log: newLog });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /history - Get logs for a specific date
router.get('/history', async (req, res) => {
    try {
        const { user_id, date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        const userId = user_id || "nihan_001";

        const logs = await DailyLog.find({ user_id: userId, date: targetDate });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
