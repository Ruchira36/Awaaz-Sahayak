require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/process', require('./routes/process'));
app.use('/api/extract-doc', require('./routes/extractDoc'));
app.use('/api/generate-pdf', require('./routes/generatePdf'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'AwaazAgent server is running' });
});

// Connect to MongoDB and start server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`AwaazAgent server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        // Start without MongoDB for demo purposes
        console.log('Starting without MongoDB...');
        app.listen(PORT, () => {
            console.log(`AwaazAgent server running on http://localhost:${PORT} (no DB)`);
        });
    }
};

startServer();
