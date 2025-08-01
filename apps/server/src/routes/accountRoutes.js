
const express = require('express');
const AccountController = require('../controllers/accountController');

const router = express.Router();
// Get account by account number
router.get('/number/:accountNumber', AccountController.getAccountByNumber);

// Get all accounts
router.get('/', AccountController.getAllAccounts);

// Create new account
router.post('/', AccountController.createAccount);

// Get account by ID
router.get('/:id', AccountController.getAccount);

// Get accounts by customer ID
router.get('/customer/:customerId', AccountController.getAccountsByCustomer);

// Update account balance
router.patch('/:id/balance', AccountController.updateBalance);

// Update account status
router.patch('/:id/status', AccountController.updateAccountStatus);

module.exports = router;