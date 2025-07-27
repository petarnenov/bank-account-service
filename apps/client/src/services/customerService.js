import axios from 'axios';

// Use empty string as default for production (same-origin), localhost for dev
const API_BASE_URL = typeof process.env.REACT_APP_API_URL !== 'undefined' && process.env.REACT_APP_API_URL !== ''
    ? process.env.REACT_APP_API_URL
    : (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

class CustomerService {
    static async getAllCustomers() {
        try {
            const response = await api.get('/customers');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch customers');
        }
    }

    static async getActiveCustomers() {
        try {
            const response = await api.get('/customers/active');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch active customers');
        }
    }

    static async getCustomerById(id) {
        try {
            const response = await api.get(`/customers/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch customer');
        }
    }

    static async createCustomer(customerData) {
        try {
            // Ensure camelCase keys for backend compatibility
            const payload = {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
                dateOfBirth: customerData.dateOfBirth,
                status: customerData.status
            };
            const response = await api.post('/customers', payload);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to create customer');
        }
    }

    static async updateCustomer(id, customerData) {
        try {
            const response = await api.put(`/customers/${id}`, customerData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to update customer');
        }
    }

    static async deleteCustomer(id) {
        try {
            const response = await api.delete(`/customers/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to delete customer');
        }
    }
}

export default CustomerService;
