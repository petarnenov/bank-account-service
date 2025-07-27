const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

class Customer {
    constructor({
        id,
        firstName,
        lastName,
        email,
        phone,
        address,
        dateOfBirth,
        status,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.dateOfBirth = dateOfBirth;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async searchByName(name) {
        const query = `SELECT id, first_name, last_name, email, phone, address, date_of_birth, status, created_at, updated_at FROM customers WHERE LOWER(first_name) LIKE LOWER($1) OR LOWER(last_name) LIKE LOWER($1) ORDER BY first_name, last_name`;
        const result = await pool.query(query, [`%${name}%`]);
        return result.rows.map(row => new Customer({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            dateOfBirth: row.date_of_birth,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
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

    static async createCustomer({ firstName, lastName, email, phone, address, dateOfBirth, status = 'active' }) {
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
            INSERT INTO customers (id, first_name, last_name, email, phone, address, date_of_birth, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, first_name, last_name, email, phone, address, date_of_birth, status, created_at, updated_at
        `;
        const values = [customerId, firstName, lastName, email, phone, address, dateOfBirth, status];
        const result = await pool.query(query, values);
        const row = result.rows[0];
        return new Customer({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            dateOfBirth: row.date_of_birth,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    static async getCustomerById(id) {
        const query = 'SELECT id, first_name, last_name, email, phone, address, date_of_birth, status, created_at, updated_at FROM customers WHERE id = $1';
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Customer({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            dateOfBirth: row.date_of_birth,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }

    static async getAllCustomers() {
        const query = 'SELECT id, first_name, last_name, email, phone, address, date_of_birth, status, created_at, updated_at FROM customers ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows.map(row => new Customer({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            dateOfBirth: row.date_of_birth,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    static async getActiveCustomers() {
        const query = 'SELECT id, first_name, last_name, email, phone, address, date_of_birth, status, created_at, updated_at FROM customers WHERE status = \'active\' ORDER BY first_name, last_name';
        const result = await pool.query(query);
        return result.rows.map(row => new Customer({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            dateOfBirth: row.date_of_birth,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    static async updateCustomer(id, updates) {
        // Map JavaScript property names to database column names
        const columnMap = {
            firstName: 'first_name',
            lastName: 'last_name',
            email: 'email',
            phone: 'phone',
            address: 'address',
            dateOfBirth: 'date_of_birth',
            status: 'status'
        };

        const dbUpdates = {};
        Object.keys(updates).forEach(key => {
            const dbColumnName = columnMap[key] || key;
            dbUpdates[dbColumnName] = updates[key];
        });

        const setClause = Object.keys(dbUpdates).map((key, index) => `${key} = $${index + 2}`).join(', ');
        const query = `
            UPDATE customers 
            SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING id, first_name, last_name, email, phone, address, date_of_birth, status, created_at, updated_at
        `;
        const values = [id, ...Object.values(dbUpdates)];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Customer({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: row.address,
            dateOfBirth: row.date_of_birth,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }
}

module.exports = Customer;