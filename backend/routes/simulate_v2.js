const express = require('express');
const router = express.Router();
const KnowledgeBase = require('../models/KnowledgeBase');
const User = require('../models/User');
const { simulateStack } = require('../simulation_v2');

// GET /test
router.get('/test', (req, res) => {
    res.json({ message: "V2 Router is working" });
});

// POST /stack
router.post('/stack', async (req, res) => {
    try {
        if (!req.body) throw new Error("Request body is undefined");
        const { userId, stack } = req.body;

        if (!stack || !Array.isArray(stack)) {
            return res.status(400).json({ error: "Invalid stack format" });
        }

        // 1. Fetch User
        const user = await User.findOne({ user_id: userId || "nihan_001" });
        if (!user) return res.status(404).json({ error: "User not found" });

        // Safe Access Helper
        const getGenetics = (key) => {
            if (!user.genetics) return "WildType";
            if (user.genetics instanceof Map) return user.genetics.get(key);
            return user.genetics[key];
        };

        // 2. Build KB Map & Resolve Genotypes
        const kbMap = {};
        const enrichedStack = [];

        for (const item of stack) {
            // Find KB Entry (Case insensitive search could be optimized here)
            let kb = await KnowledgeBase.findOne({ drug: item.drugName });

            // Aliasing for Demo
            if (!kb && (item.drugName === "Coke" || item.drugName === "Espresso")) {
                kb = await KnowledgeBase.findOne({ drug: "Caffeine" });
            }

            if (kb) {
                kbMap[item.drugName] = kb;

                // Resolve Genotype
                const userVariant = getGenetics(kb.variant_id) || "WildType";

                // Get Genotype Data Safely
                const genotypes = kb.genotypes || {};
                let genotypeData = (genotypes instanceof Map ? genotypes.get(userVariant) : genotypes[userVariant]);

                // Fallback
                if (!genotypeData) {
                    const keys = (genotypes instanceof Map ? Array.from(genotypes.keys()) : Object.keys(genotypes));
                    if (keys.length > 0) {
                        const firstKey = keys[0];
                        genotypeData = (genotypes instanceof Map ? genotypes.get(firstKey) : genotypes[firstKey]);
                    }
                }

                if (genotypeData) {
                    enrichedStack.push({
                        ...item,
                        resolvedGenotypeData: genotypeData,
                        weightKg: user.weight_kg || 70
                    });
                }
            }
        }

        // 3. Run Simulation
        const result = simulateStack(enrichedStack, kbMap);

        res.json({
            success: true,
            user: user.name,
            input_stack_count: stack.length,
            processed_stack_count: enrichedStack.length,
            timeline: result.timeline,
            risks: result.detectedRisks
        });

    } catch (error) {
        console.error("Stack Sim Error:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

module.exports = router;
