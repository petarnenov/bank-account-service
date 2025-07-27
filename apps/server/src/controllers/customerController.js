// filepath: /home/petar/ai-projects/account-service/apps/server/src/controllers/customerController.js
const Customer = require('../models/Customer');

class CustomerController {
    static async createCustomer(req, res) {
        try {
            const { firstName, lastName, email, phone, address, dateOfBirth, status = 'active' } = req.body;
            const customer = await Customer.createCustomer({
                firstName,
                lastName,
                email,
                phone,
                address,
                dateOfBirth,
                status
            });
            res.status(201).json(customer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getCustomer(req, res) {
        try {
            const { id } = req.params;
            const customer = await Customer.getCustomerById(id);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getAllCustomers(req, res) {
        try {
            const customers = await Customer.getAllCustomers();
            res.json(customers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async getActiveCustomers(req, res) {
        try {
            const customers = await Customer.getActiveCustomers();
            res.json(customers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateCustomer(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            const customer = await Customer.updateCustomer(id, updates);
            if (!customer) {
                return res.status(404).json({ error: 'Customer not found' });
            }
            res.json(customer);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CustomerController;