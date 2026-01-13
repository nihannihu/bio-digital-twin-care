const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const KnowledgeBase = require('./models/KnowledgeBase');
const fs = require('fs');
const path = require('path');

// Load env vars
dotenv.config();

// Connect to DB
connectDB();

// Read JSON data
const knowledgeData = JSON.parse(fs.readFileSync(path.join(__dirname, 'knowledge_base_v2.json'), 'utf8'));

// Initial User Data
const usersData = [
    {
        user_id: "nihan_001",
        name: "Nihan",
        weight_kg: 70,
        genetics: {
            "rs762551": "CC" // Slow Metabolizer
        },
        current_status: {
            caffeine_level_mg: 0
        }
    }
];

const importData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await KnowledgeBase.deleteMany();

        console.log('Data Destroyed...');

        // Insert Knowledge Base
        // Format of knowledge_base.json is single object, but Schema expects entries
        // Let's create one entry for CYP1A2 for now based on the structure
        await KnowledgeBase.create(knowledgeData);

        // Insert Users
        await User.insertMany(usersData);

        console.log('Data Imported!');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    // Destroy Data logic could be here if separated
} else {
    importData();
}
