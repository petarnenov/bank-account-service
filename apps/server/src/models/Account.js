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
    constructor({
        id,
        accountNumber,
        accountType,
        balance,
        currency,
        customerId,
        status,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.accountNumber = accountNumber;
        this.accountType = accountType;
        this.balance = parseFloat(balance) || 0;
        this.currency = currency;
        this.customerId = customerId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static async getCustomerIdByAccountNumber(accountNumber) {
        const query = `SELECT customer_id FROM accounts WHERE account_number = $1`;
        const result = await pool.query(query, [accountNumber]);
        if (result.rows.length === 0) return null;
        return result.rows[0].customer_id;
    }

    static async createAccount({accountNumber, accountType, balance, currency, customerId, status = 'active'}) {
        const query = `
            INSERT INTO accounts (account_number, account_type, balance, currency, customer_id, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at
        `;
        const values = [accountNumber, accountType, balance, currency, customerId, status];
        const result = await pool.query(query, values);
        const {id, account_number, account_type, balance: bal, currency: curr, customer_id, status: accStatus, created_at, updated_at} = result.rows[0];
        return new Account({
            id,
            accountNumber: account_number,
            accountType: account_type,
            balance: bal,
            currency: curr,
            customerId: customer_id,
            status: accStatus,
            createdAt: created_at,
            updatedAt: updated_at
        });
    }

    static async getAccountById(id) {
        const query = `
            SELECT id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at 
            FROM accounts 
            WHERE id = $1
        `;
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) return null;
        const {id: accountId, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at} = result.rows[0];
        return new Account({
            id: accountId,
            accountNumber: account_number,
            accountType: account_type,
            balance,
            currency,
            customerId: customer_id,
            status,
            createdAt: created_at,
            updatedAt: updated_at
        });
    }

    static async getAccountByNumber(accountNumber) {
        const query = `
            SELECT id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at 
            FROM accounts
            WHERE account_number = $1
        `;
        const result = await pool.query(query, [accountNumber]);
        if (result.rows.length === 0) return null;
        const {id, account_number: accNum, account_type, balance, currency, customer_id, status, created_at, updated_at} = result.rows[0];
        return new Account({
            id,
            accountNumber: accNum,
            accountType: account_type,
            balance,
            currency,
            customerId: customer_id,
            status,
            createdAt: created_at,
            updatedAt: updated_at
        });
    }

    static async getAccountsByCustomerId(customerId) {
        const query = `
            SELECT id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at 
            FROM accounts 
            WHERE customer_id = $1
        `;
        const result = await pool.query(query, [customerId]);
        return result.rows.map(row => new Account({
            id: row.id,
            accountNumber: row.account_number,
            accountType: row.account_type,
            balance: row.balance,
            currency: row.currency,
            customerId: row.customer_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    static async updateBalance(id, newBalance) {
        const query = `
            UPDATE accounts 
            SET balance = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at
        `;
        const result = await pool.query(query, [newBalance, id]);
        if (result.rows.length === 0) return null;
        const {id: accountId, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at} = result.rows[0];
        return new Account({
            id: accountId,
            accountNumber: account_number,
            accountType: account_type,
            balance,
            currency,
            customerId: customer_id,
            status,
            createdAt: created_at,
            updatedAt: updated_at
        });
    }

    static async getAllAccounts() {
        const query = `
            SELECT id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at 
            FROM accounts 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows.map(row => new Account({
            id: row.id,
            accountNumber: row.account_number,
            accountType: row.account_type,
            balance: row.balance,
            currency: row.currency,
            customerId: row.customer_id,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    }

    static async updateAccountStatus(id, status) {
        const query = `
            UPDATE accounts 
            SET status = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 
            RETURNING id, account_number, account_type, balance, currency, customer_id, status, created_at, updated_at
        `;
        const result = await pool.query(query, [status, id]);
        if (result.rows.length === 0) return null;
        const {id: accountId, account_number, account_type, balance, currency, customer_id, status: accountStatus, created_at, updated_at} = result.rows[0];
        return new Account({
            id: accountId,
            accountNumber: account_number,
            accountType: account_type,
            balance,
            currency,
            customerId: customer_id,
            status: accountStatus,
            createdAt: created_at,
            updatedAt: updated_at
        });
    }
}

module.exports = Account;