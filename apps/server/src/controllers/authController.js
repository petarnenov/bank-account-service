const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthController {
    static async login(req, res) {
        try {
            const {username, password} = req.body;

            if (!username || !password) {
                return res.status(400).json({error: 'Username and password are required'});
            }

            // Find user by username or email
            let user = await User.getUserByUsername(username);
            if (!user) {
                user = await User.getUserByEmail(username);
            }

            if (!user) {
                return res.status(401).json({error: 'Invalid credentials'});
            }

            // Validate password
            const isPasswordValid = await User.validatePassword(password, user.password_hash);
            if (!isPasswordValid) {
                return res.status(401).json({error: 'Invalid credentials'});
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET || 'your-secret-key',
                {expiresIn: '24h'}
            );

            // Return user info and token (excluding password)
            const userResponse = {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            };

            res.json({
                message: 'Login successful',
                user: userResponse,
                token
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({error: 'Internal server error'});
        }
    }

    static async register(req, res) {
        try {
            const {username, email, password, firstName, lastName} = req.body;

            if (!username || !email || !password) {
                return res.status(400).json({error: 'Username, email, and password are required'});
            }

            // Check if user already exists
            const existingUser = await User.getUserByUsername(username);
            if (existingUser) {
                return res.status(409).json({error: 'Username already exists'});
            }

            const existingEmail = await User.getUserByEmail(email);
            if (existingEmail) {
                return res.status(409).json({error: 'Email already exists'});
            }

            // Create new user
            const user = await User.createUser(username, email, password, firstName, lastName);

            // Generate JWT token
            const token = jwt.sign(
                {
                    userId: user.id,
                    username: user.username,
                    role: user.role
                },
                process.env.JWT_SECRET || 'your-secret-key',
                {expiresIn: '24h'}
            );

            res.status(201).json({
                message: 'Registration successful',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                },
                token
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({error: 'Internal server error'});
        }
    }

    static async getProfile(req, res) {
        try {
            const user = await User.getUserById(req.user.userId);
            if (!user) {
                return res.status(404).json({error: 'User not found'});
            }

            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({error: 'Internal server error'});
        }
    }

    static async logout(req, res) {
        // For JWT, logout is typically handled client-side by removing the token
        // In a more advanced setup, you might maintain a blacklist of tokens
        res.json({message: 'Logout successful'});
    }
}

module.exports = AuthController;
