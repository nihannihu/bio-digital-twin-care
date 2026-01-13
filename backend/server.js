const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const simulateRoutes = require('./routes/simulate');
const simulateV2Routes = require('./routes/simulate_v2');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', simulateRoutes);
app.use('/api/v2', simulateV2Routes);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('Bio-Digital Twin API is running...');
});

// Start Server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
