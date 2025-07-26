const {Pool} = require('pg');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

class Account {
    constructor(id, accountNumber, accountType, balance, currency, customerId, status, createdAt, updatedAt) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.balance = balance;
        this.currency = currency;
        this.customerId = customerId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async createAccount(accountNumber, accountType, balance, currency, customerId) {
        const query = `
            INSERT INTO accounts (account_number, account_type, balance, currency, customer_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        const values = [accountNumber, accountType, balance, currency, customerId];
        const result = await pool.query(query, values);
        return new Account(...Object.values(result.rows[0]));
    }

    static async getAccountById(id) {
        const query = 'SELECT * FROM accounts WHERE id = $1';
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        return new Account(...Object.values(result.rows[0]));
    }

    static async getAccountByNumber(accountNumber) {
        const query = 'SELECT * FROM accounts WHERE account_number = $1';
        const result = await pool.query(query, [accountNumber]);
        if (result.rows.length === 0) return null;
        return new Account(...Object.values(result.rows[0]));
    }

    static async getAccountsByCustomerId(customerId) {
        const query = 'SELECT * FROM accounts WHERE customer_id = $1';
        const result = await pool.query(query, [customerId]);
        return result.rows.map(row => new Account(...Object.values(row)));
    }

    static async updateBalance(id, newBalance) {
        const query = `
            UPDATE accounts 
            SET balance = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [newBalance, id]);
        if (result.rows.length === 0) return null;
        return new Account(...Object.values(result.rows[0]));
    }

    static async getAllAccounts() {
        const query = 'SELECT * FROM accounts ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows.map(row => new Account(...Object.values(row)));
    }

    static async updateAccountStatus(id, status) {
        const query = `
            UPDATE accounts 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) return null;
        return new Account(...Object.values(result.rows[0]));
    }
}

module.exports = Account;