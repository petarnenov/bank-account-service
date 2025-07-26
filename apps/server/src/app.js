const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from the server's .env file specifically
require('dotenv').config({path: path.join(__dirname, '../.env')});

// Debug environment variables
console.log('DEBUG: PORT from env:', process.env.PORT);
console.log('DEBUG: NODE_ENV from env:', process.env.NODE_ENV);

const customerRoutes = require('./routes/customerRoutes');
const accountRoutes = require('./routes/accountRoutes');
const authRoutes = require('./routes/authRoutes');
const {authenticateToken} = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
    res.json({status: 'OK', message: 'Server is running!', timestamp: new Date().toISOString()});
});

// Mount routes
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/customers', authenticateToken, customerRoutes);
app.use('/api/accounts', authenticateToken, accountRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});