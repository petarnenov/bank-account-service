const Account = require('../models/Account');

class AccountController {
    // Helper function to generate a unique 20-character account number
    static generateAccountNumber() {
        // Use a shorter timestamp (last 8 digits) + 12 random characters = exactly 20 chars
        const shortTimestamp = Date.now().toString().slice(-8);
        const randomPart = Math.random().toString(36).substring(2, 14).toUpperCase().padEnd(12, '0');

        const accountNumber = shortTimestamp + randomPart;

        // Ensure exactly 20 characters
        return accountNumber.substring(0, 20);
    }

    static async createAccount(req, res) {
        try {
            let {accountType, balance, currency, customerId, status = 'active'} = req.body;

            // Validate required fields
            if (!accountType || !customerId) {
                return res.status(400).json({error: 'Account type and customer ID are required'});
            }

            // Auto-generate a unique account number (always server-side)
            let accountNumber = AccountController.generateAccountNumber();

            // Ensure uniqueness by checking if account number already exists
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                const existingAccount = await Account.getAccountByNumber(accountNumber);
                if (!existingAccount) {
                    isUnique = true;
                } else {
                    accountNumber = AccountController.generateAccountNumber();
                    attempts++;
                }
            }

            if (!isUnique) {
                return res.status(500).json({error: 'Unable to generate unique account number'});
            }

            const account = await Account.createAccount(accountNumber, accountType, balance, currency, customerId, status);
            res.status(201).json(account);
        } catch (error) {
            if (error.code === '23505') { // PostgreSQL unique constraint violation
                return res.status(409).json({error: 'Account number already exists'});
            }
            res.status(500).json({error: error.message});
        }
    }

    static async getAccount(req, res) {
        try {
            const {id} = req.params;
            const account = await Account.getAccountById(id);
            if (!account) {
                return res.status(404).json({error: 'Account not found'});
            }
            res.json(account);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    static async getAccountsByCustomer(req, res) {
        try {
            const {customerId} = req.params;
            const accounts = await Account.getAccountsByCustomerId(customerId);
            res.json(accounts);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    static async getAllAccounts(req, res) {
        try {
            const accounts = await Account.getAllAccounts();
            res.json(accounts);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    static async updateBalance(req, res) {
        try {
            const {id} = req.params;
            const {balance} = req.body;
            const account = await Account.updateBalance(id, balance);
            if (!account) {
                return res.status(404).json({error: 'Account not found'});
            }
            res.json(account);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    static async updateAccountStatus(req, res) {
        try {
            const {id} = req.params;
            const {status} = req.body;
            const account = await Account.updateAccountStatus(id, status);
            if (!account) {
                return res.status(404).json({error: 'Account not found'});
            }
            res.json(account);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
}

module.exports = AccountController;