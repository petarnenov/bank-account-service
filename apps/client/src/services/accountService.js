import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL + '/api',
    timeout: 10000,
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

class AccountService {
    static async getAllAccounts() {
        try {
            const response = await api.get('/accounts');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch accounts');
        }
    }

    static async getAccountById(id) {
        try {
            const response = await api.get(`/accounts/${id}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch account');
        }
    }

    static async getAccountsByCustomerId(customerId) {
        try {
            const response = await api.get(`/accounts/customer/${customerId}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to fetch customer accounts');
        }
    }

    static async createAccount(accountData) {
        try {
            const response = await api.post('/accounts', accountData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to create account');
        }
    }

    static async updateBalance(id, balance) {
        try {
            const response = await api.patch(`/accounts/${id}/balance`, {balance});
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to update balance');
        }
    }

    static async updateAccountStatus(id, status) {
        try {
            const response = await api.patch(`/accounts/${id}/status`, {status});
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.error || 'Failed to update account status');
        }
    }
}

export default AccountService;
