const {Pool} = require('pg');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

class Customer {
    constructor(id, firstName, lastName, email, phone, address, dateOfBirth, createdAt, updatedAt) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.dateOfBirth = dateOfBirth;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Helper function to generate a unique 20-character customer ID
    static generateCustomerId() {
        // Use timestamp (last 8 digits) + 12 random characters = exactly 20 chars
        const shortTimestamp = Date.now().toString().slice(-8);
        const randomPart = Math.random().toString(36).substring(2, 14).toUpperCase().padEnd(12, '0');

        const customerId = shortTimestamp + randomPart;

        // Ensure exactly 20 characters
        return customerId.substring(0, 20);
    }

    static async createCustomer(firstName, lastName, email, phone, address, dateOfBirth) {
        // Auto-generate a unique customer ID
        let customerId = Customer.generateCustomerId();

        // Ensure uniqueness by checking if customer ID already exists
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;

        while (!isUnique && attempts < maxAttempts) {
            const existingCustomer = await Customer.getCustomerById(customerId);
            if (!existingCustomer) {
                isUnique = true;
            } else {
                customerId = Customer.generateCustomerId();
                attempts++;
            }
        }

        if (!isUnique) {
            throw new Error('Unable to generate unique customer ID');
        }

        const query = `
            INSERT INTO customers (id, first_name, last_name, email, phone, address, date_of_birth)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [customerId, firstName, lastName, email, phone, address, dateOfBirth];
        const result = await pool.query(query, values);
        return new Customer(...Object.values(result.rows[0]));
    }

    static async getCustomerById(id) {
        const query = 'SELECT * FROM customers WHERE id = $1';
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        return new Customer(...Object.values(result.rows[0]));
    }

    static async getAllCustomers() {
        const query = 'SELECT * FROM customers ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows.map(row => new Customer(...Object.values(row)));
    }

    static async updateCustomer(id, updates) {
        const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const query = `
            UPDATE customers 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING *
        `;
        const values = [id, ...Object.values(updates)];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        return new Customer(...Object.values(result.rows[0]));
    }
}

module.exports = Customer;