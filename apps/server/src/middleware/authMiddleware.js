const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({error: 'Access token required'});
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Verify user still exists and is active
        const user = await User.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({error: 'Invalid token - user not found'});
        }

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({error: 'Token expired'});
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({error: 'Invalid token'});
        }
        return res.status(500).json({error: 'Token verification failed'});
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({error: 'Authentication required'});
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({error: 'Insufficient permissions'});
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};
