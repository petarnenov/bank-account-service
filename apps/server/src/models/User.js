const {Pool} = require('pg');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

class User {
    static async createUser(username, email, password, firstName, lastName, role = 'user') {
        const passwordHash = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO users (username, email, password_hash, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, username, email, first_name, last_name, role, is_active, created_at, updated_at
        `;

        const result = await pool.query(query, [username, email, passwordHash, firstName, lastName, role]);
        return result.rows[0];
    }

    static async getUserByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
        const result = await pool.query(query, [username]);
        return result.rows[0];
    }

    static async getUserByEmail(email) {
        const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }

    static async getUserById(id) {
        const query = 'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    static async validatePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async updateUser(id, updates) {
        const setClause = [];
        const values = [];
        let paramCount = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (key === 'password') {
                setClause.push(`password_hash = $${paramCount}`);
                values.push(await bcrypt.hash(value, 10));
            } else {
                setClause.push(`${key} = $${paramCount}`);
                values.push(value);
            }
            paramCount++;
        }

        setClause.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const query = `
            UPDATE users 
            SET ${setClause.join(', ')}
            WHERE id = $${paramCount}
            RETURNING id, username, email, first_name, last_name, role, is_active, created_at, updated_at
        `;

        const result = await pool.query(query, values);
        return result.rows[0];
    }

    static async getAllUsers() {
        const query = 'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = User;
