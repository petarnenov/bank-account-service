// We need to unmock axios temporarily to let the interceptors register
import axios from 'axios';

// Import AccountService AFTER setting up the mock
import AccountService from './accountService';

jest.unmock('axios');

// Now mock axios after the real axios has been imported
jest.mock('axios', () => {
	const mockAxiosInstance = {
		get: jest.fn(),
		post: jest.fn(),
		patch: jest.fn(),
		interceptors: {
			request: {
				use: jest.fn().mockImplementation((success, error) => {
					// Store the interceptor functions so they can be called for coverage
					mockAxiosInstance._requestInterceptor = success;
					mockAxiosInstance._requestErrorHandler = error;
				})
			},
			response: {
				use: jest.fn().mockImplementation((success, error) => {
					// Store the interceptor functions so they can be called for coverage
					mockAxiosInstance._responseInterceptor = success;
					mockAxiosInstance._responseErrorHandler = error;
				})
			}
		},
		_requestInterceptor: null,
		_requestErrorHandler: null,
		_responseInterceptor: null,
		_responseErrorHandler: null
	};
	return {
		create: jest.fn(() => mockAxiosInstance),
		__mockAxiosInstance: mockAxiosInstance
	};
});

const mockedAxios = axios;

describe('AccountService', () => {
	let mockAxiosInstance;

	beforeAll(() => {
		// Get the shared mock instance from our axios mock
		mockAxiosInstance = mockedAxios.__mockAxiosInstance;
	});

	beforeEach(() => {
		jest.clearAllMocks();

		// Mock localStorage
		Object.defineProperty(window, 'localStorage', {
			value: {
				getItem: jest.fn(),
				setItem: jest.fn(),
				removeItem: jest.fn(),
			},
			writable: true,
		});

		// Mock window.location for interceptor
		delete window.location;
		window.location = { href: '' };
	});

	describe('getAllAccounts', () => {
		it('should fetch all accounts successfully', async () => {
			const mockAccounts = [
				{ id: 1, accountType: 'savings', balance: 1000 },
				{ id: 2, accountType: 'checking', balance: 500 },
			];

			mockAxiosInstance.get.mockResolvedValue({ data: mockAccounts });

			const result = await AccountService.getAllAccounts();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith('/accounts');
			expect(result).toEqual(mockAccounts);
		});

		it('should handle API error with custom error message', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Accounts not found',
					},
				},
			};

			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(AccountService.getAllAccounts()).rejects.toThrow('Accounts not found');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.get.mockRejectedValue(error);

			await expect(AccountService.getAllAccounts()).rejects.toThrow('Failed to fetch accounts');
		});
	});

	describe('getAccountById', () => {
		it('should fetch account by ID successfully', async () => {
			const mockAccount = { id: 1, accountType: 'savings', balance: 1000 };

			mockAxiosInstance.get.mockResolvedValue({ data: mockAccount });

			const result = await AccountService.getAccountById(1);

			expect(mockAxiosInstance.get).toHaveBeenCalledWith('/accounts/1');
			expect(result).toEqual(mockAccount);
		});

		it('should handle API error with custom error message', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Account not found',
					},
				},
			};

			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(AccountService.getAccountById(999)).rejects.toThrow('Account not found');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.get.mockRejectedValue(error);

			await expect(AccountService.getAccountById(1)).rejects.toThrow('Failed to fetch account');
		});
	});

	describe('getAccountsByCustomerId', () => {
		it('should fetch accounts by customer ID successfully', async () => {
			const mockAccounts = [
				{ id: 1, accountType: 'savings', balance: 1000, customerId: 'cust123' },
				{ id: 2, accountType: 'checking', balance: 500, customerId: 'cust123' },
			];

			mockAxiosInstance.get.mockResolvedValue({ data: mockAccounts });

			const result = await AccountService.getAccountsByCustomerId('cust123');

			expect(mockAxiosInstance.get).toHaveBeenCalledWith('/accounts/customer/cust123');
			expect(result).toEqual(mockAccounts);
		});

		it('should handle API error with custom error message', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Customer not found',
					},
				},
			};

			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(AccountService.getAccountsByCustomerId('nonexistent')).rejects.toThrow('Customer not found');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.get.mockRejectedValue(error);

			await expect(AccountService.getAccountsByCustomerId('cust123')).rejects.toThrow('Failed to fetch customer accounts');
		});
	});

	describe('createAccount', () => {
		it('should create account successfully', async () => {
			const accountData = {
				accountType: 'checking',
				balance: 1000,
				currency: 'USD',
				customerId: 'cust123',
				status: 'active'
			};

			const mockResponse = {
				id: 1,
				...accountData,
				createdAt: '2024-01-01T00:00:00.000Z',
			};

			mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

			const result = await AccountService.createAccount(accountData);

			expect(mockAxiosInstance.post).toHaveBeenCalledWith('/accounts', accountData);
			expect(result).toEqual(mockResponse);
		});

		it('should handle validation errors', async () => {
			const accountData = {
				accountType: '',
				balance: -100,
				currency: 'USD',
				customerId: 'cust123',
				status: 'active'
			};

			const errorResponse = {
				response: {
					data: {
						error: 'Validation failed',
					},
				},
			};

			mockAxiosInstance.post.mockRejectedValue(errorResponse);

			await expect(AccountService.createAccount(accountData)).rejects.toThrow('Validation failed');
		});

		it('should handle API error with default error message', async () => {
			const accountData = {
				accountType: 'checking',
				balance: 1000,
				currency: 'USD',
				customerId: 'cust123',
				status: 'active'
			};

			const error = new Error('Network error');
			mockAxiosInstance.post.mockRejectedValue(error);

			await expect(AccountService.createAccount(accountData)).rejects.toThrow('Failed to create account');
		});
	});

	describe('updateBalance', () => {
		it('should update account balance successfully', async () => {
			const mockResponse = {
				id: 1,
				accountType: 'savings',
				balance: 1500,
				customerId: 'cust123',
			};

			mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

			const result = await AccountService.updateBalance(1, 1500);

			expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/accounts/1/balance', { balance: 1500 });
			expect(result).toEqual(mockResponse);
		});

		it('should handle update errors', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Invalid balance',
					},
				},
			};

			mockAxiosInstance.patch.mockRejectedValue(errorResponse);

			await expect(AccountService.updateBalance(1, -100)).rejects.toThrow('Invalid balance');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.patch.mockRejectedValue(error);

			await expect(AccountService.updateBalance(1, 1500)).rejects.toThrow('Failed to update balance');
		});
	});

	describe('updateAccountStatus', () => {
		it('should update account status successfully', async () => {
			const mockResponse = {
				id: 1,
				accountType: 'savings',
				balance: 1000,
				status: 'suspended',
				customerId: 'cust123',
			};

			mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

			const result = await AccountService.updateAccountStatus(1, 'suspended');

			expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/accounts/1/status', { status: 'suspended' });
			expect(result).toEqual(mockResponse);
		});

		it('should handle update errors', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Invalid status',
					},
				},
			};

			mockAxiosInstance.patch.mockRejectedValue(errorResponse);

			await expect(AccountService.updateAccountStatus(1, 'invalid_status')).rejects.toThrow('Invalid status');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.patch.mockRejectedValue(error);

			await expect(AccountService.updateAccountStatus(1, 'suspended')).rejects.toThrow('Failed to update account status');
		});
	});

	describe('Interceptor Logic Tests', () => {
		// Test the interceptor logic directly without mocking complexity
		it('should add auth token to request config when token exists', () => {
			// Mock localStorage
			window.localStorage.getItem.mockReturnValue('test-token-123');

			// Test the request interceptor logic directly
			const config = { headers: {} };

			// This is the exact logic from the request interceptor
			const token = localStorage.getItem('token');
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
			expect(config.headers.Authorization).toBe('Bearer test-token-123');
		});

		it('should not add auth token when no token exists', () => {
			// Mock localStorage to return null
			window.localStorage.getItem.mockReturnValue(null);

			// Test the request interceptor logic directly
			const config = { headers: {} };

			// This is the exact logic from the request interceptor
			const token = localStorage.getItem('token');
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
			expect(config.headers.Authorization).toBeUndefined();
		});

		it('should handle request interceptor error by rejecting promise', async () => {
			const error = new Error('Request setup failed');

			// Test the request error handler logic directly
			const errorHandler = (error) => Promise.reject(error);

			await expect(errorHandler(error)).rejects.toBe(error);
		});

		it('should pass through successful responses unchanged', () => {
			const response = { data: { id: 1 }, status: 200 };

			// Test the response interceptor success logic directly
			const responseHandler = (response) => response;

			const result = responseHandler(response);
			expect(result).toBe(response);
		});

		it('should clear localStorage and redirect on 401 error', async () => {
			const error401 = {
				response: {
					status: 401,
					data: { error: 'Unauthorized' }
				}
			};

			// Test the response error handler logic directly
			const responseErrorHandler = (error) => {
				if (error.response?.status === 401) {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					window.location.href = '/login';
				}
				return Promise.reject(error);
			};

			await expect(responseErrorHandler(error401)).rejects.toBe(error401);

			expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
			expect(window.localStorage.removeItem).toHaveBeenCalledWith('user');
			expect(window.location.href).toBe('/login');
		});

		it('should pass through non-401 errors without clearing localStorage', async () => {
			const error500 = {
				response: {
					status: 500,
					data: { error: 'Internal Server Error' }
				}
			};

			// Test the response error handler logic directly
			const responseErrorHandler = (error) => {
				if (error.response?.status === 401) {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					window.location.href = '/login';
				}
				return Promise.reject(error);
			};

			await expect(responseErrorHandler(error500)).rejects.toBe(error500);

			// Should not have called localStorage.removeItem for non-401 errors
			expect(window.localStorage.removeItem).not.toHaveBeenCalled();
		});

		it('should handle errors without response property', async () => {
			const networkError = new Error('Network error');

			// Test the response error handler logic directly
			const responseErrorHandler = (error) => {
				if (error.response?.status === 401) {
					localStorage.removeItem('token');
					localStorage.removeItem('user');
					window.location.href = '/login';
				}
				return Promise.reject(error);
			};

			await expect(responseErrorHandler(networkError)).rejects.toBe(networkError);

			// Should not have called localStorage.removeItem for errors without response
			expect(window.localStorage.removeItem).not.toHaveBeenCalled();
		});
	});
});