const express = require('express');
const CustomerController = require('../controllers/customerController');

const router = express.Router();

// Get all customers
router.get('/', CustomerController.getAllCustomers);

// Get active customers only
router.get('/active', CustomerController.getActiveCustomers);

// Create new customer
router.post('/', CustomerController.createCustomer);

// Get customer by ID
router.get('/:id', CustomerController.getCustomer);

// Update customer
router.put('/:id', CustomerController.updateCustomer);

module.exports = router;