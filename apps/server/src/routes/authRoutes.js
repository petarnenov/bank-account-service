const express = require('express');
const AuthController = require('../controllers/authController');
const {authenticateToken} = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post('/logout', AuthController.logout);

module.exports = router;
