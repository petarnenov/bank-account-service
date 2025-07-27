const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from the server's .env file specifically
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Debug environment variables
console.log('DEBUG: PORT from env:', process.env.PORT);
console.log('DEBUG: NODE_ENV from env:', process.env.NODE_ENV);

const customerRoutes = require('./routes/customerRoutes');
const accountRoutes = require('./routes/accountRoutes');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running!', timestamp: new Date().toISOString() });
});

// Mount routes
// /api/ai and /api/auth are public
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/accounts', authenticateToken, accountRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/build')));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API route not found' });
        }
        res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});