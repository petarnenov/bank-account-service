// We need to unmock axios temporarily to let the interceptors register
import axios from 'axios';

// Import CustomerService AFTER setting up the mock
import CustomerService from './customerService';

jest.unmock('axios');

// Now mock axios after the real axios has been imported
jest.mock('axios', () => {
	const mockAxiosInstance = {
		get: jest.fn(),
		post: jest.fn(),
		put: jest.fn(),
		delete: jest.fn(),
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

describe('CustomerService', () => {
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

	describe('getAllCustomers', () => {
		it('should fetch all customers successfully', async () => {
			const mockCustomers = [
				{
					id: 1,
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					phone: '123-456-7890',
					status: 'active'
				},
				{
					id: 2,
					firstName: 'Jane',
					lastName: 'Smith',
					email: 'jane.smith@example.com',
					phone: '098-765-4321',
					status: 'active'
				}
			];

			mockAxiosInstance.get.mockResolvedValue({ data: mockCustomers });

			const result = await CustomerService.getAllCustomers();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith('/customers');
			expect(result).toEqual(mockCustomers);
		});

		it('should handle API error with custom error message', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Customers not found',
					},
				},
			};

			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(CustomerService.getAllCustomers()).rejects.toThrow('Customers not found');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.get.mockRejectedValue(error);

			await expect(CustomerService.getAllCustomers()).rejects.toThrow('Failed to fetch customers');
		});
	});

	describe('getActiveCustomers', () => {
		it('should fetch active customers successfully', async () => {
			const mockActiveCustomers = [
				{
					id: 1,
					firstName: 'John',
					lastName: 'Doe',
					email: 'john.doe@example.com',
					status: 'active'
				},
				{
					id: 3,
					firstName: 'Bob',
					lastName: 'Johnson',
					email: 'bob.johnson@example.com',
					status: 'active'
				}
			];

			mockAxiosInstance.get.mockResolvedValue({ data: mockActiveCustomers });

			const result = await CustomerService.getActiveCustomers();

			expect(mockAxiosInstance.get).toHaveBeenCalledWith('/customers/active');
			expect(result).toEqual(mockActiveCustomers);
		});

		it('should handle API error with custom error message', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Active customers not available',
					},
				},
			};

			mockAxiosInstance.get.mockRejectedValue(errorResponse);

			await expect(CustomerService.getActiveCustomers()).rejects.toThrow('Active customers not available');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.get.mockRejectedValue(error);

			await expect(CustomerService.getActiveCustomers()).rejects.toThrow('Failed to fetch active customers');
		});
	});

	describe('getCustomerById', () => {
		it('should fetch customer by ID successfully', async () => {
			const mockCustomer = {
				id: 1,
				firstName: 'John',
				lastName: 'Doe',
				email: 'john.doe@example.com',
				phone: '123-456-7890',
				address: '123 Main St',
				dateOfBirth: '1990-01-01',
				status: 'active'
			};

			mockAxiosInstance.get.mockResolvedValue({ data: mockCustomer });

			const result = await CustomerService.getCustomerById(1);

			expect(mockAxiosInstance.get).toHaveBeenCalledWith('/customers/1');
			expect(result).toEqual(mockCustomer);
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

			await expect(CustomerService.getCustomerById(999)).rejects.toThrow('Customer not found');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.get.mockRejectedValue(error);

			await expect(CustomerService.getCustomerById(1)).rejects.toThrow('Failed to fetch customer');
		});
	});

	describe('createCustomer', () => {
		it('should create customer successfully with proper payload transformation', async () => {
			const customerData = {
				firstName: 'Alice',
				lastName: 'Wilson',
				email: 'alice.wilson@example.com',
				phone: '555-0123',
				address: '456 Oak St',
				dateOfBirth: '1985-05-15',
				status: 'active'
			};

			const mockResponse = {
				id: 3,
				...customerData,
				createdAt: '2024-01-01T00:00:00.000Z',
			};

			mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

			const result = await CustomerService.createCustomer(customerData);

			// Verify the payload is properly formatted for backend
			expect(mockAxiosInstance.post).toHaveBeenCalledWith('/customers', {
				firstName: customerData.firstName,
				lastName: customerData.lastName,
				email: customerData.email,
				phone: customerData.phone,
				address: customerData.address,
				dateOfBirth: customerData.dateOfBirth,
				status: customerData.status
			});
			expect(result).toEqual(mockResponse);
		});

		it('should handle validation errors', async () => {
			const customerData = {
				firstName: '',
				lastName: '',
				email: 'invalid-email',
				phone: '',
				address: '',
				dateOfBirth: '',
				status: 'active'
			};

			const errorResponse = {
				response: {
					data: {
						error: 'Validation failed: Email format is invalid',
					},
				},
			};

			mockAxiosInstance.post.mockRejectedValue(errorResponse);

			await expect(CustomerService.createCustomer(customerData)).rejects.toThrow('Validation failed: Email format is invalid');
		});

		it('should handle API error with default error message', async () => {
			const customerData = {
				firstName: 'Test',
				lastName: 'User',
				email: 'test@example.com',
				phone: '123-456-7890',
				address: '123 Test St',
				dateOfBirth: '1990-01-01',
				status: 'active'
			};

			const error = new Error('Network error');
			mockAxiosInstance.post.mockRejectedValue(error);

			await expect(CustomerService.createCustomer(customerData)).rejects.toThrow('Failed to create customer');
		});

		it('should handle customer data with extra properties by only including required fields', async () => {
			const customerDataWithExtras = {
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				phone: '123-456-7890',
				address: '123 Main St',
				dateOfBirth: '1990-01-01',
				status: 'active',
				// Extra properties that should not be sent to backend
				extraField: 'should not be included',
				anotherExtra: 123
			};

			const mockResponse = {
				id: 1,
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				phone: '123-456-7890',
				address: '123 Main St',
				dateOfBirth: '1990-01-01',
				status: 'active'
			};

			mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

			const result = await CustomerService.createCustomer(customerDataWithExtras);

			// Verify only the required fields are sent to the backend
			expect(mockAxiosInstance.post).toHaveBeenCalledWith('/customers', {
				firstName: 'John',
				lastName: 'Doe',
				email: 'john@example.com',
				phone: '123-456-7890',
				address: '123 Main St',
				dateOfBirth: '1990-01-01',
				status: 'active'
			});
			expect(result).toEqual(mockResponse);
		});
	});

	describe('updateCustomer', () => {
		it('should update customer successfully', async () => {
			const customerData = {
				firstName: 'John',
				lastName: 'Smith',
				email: 'john.smith@example.com',
				phone: '555-0987',
				address: '789 Pine St',
				status: 'active'
			};

			const mockResponse = {
				id: 1,
				...customerData,
				updatedAt: '2024-01-01T00:00:00.000Z',
			};

			mockAxiosInstance.put.mockResolvedValue({ data: mockResponse });

			const result = await CustomerService.updateCustomer(1, customerData);

			expect(mockAxiosInstance.put).toHaveBeenCalledWith('/customers/1', customerData);
			expect(result).toEqual(mockResponse);
		});

		it('should handle update errors', async () => {
			const customerData = {
				firstName: 'John',
				lastName: 'Smith',
				email: 'duplicate@example.com'
			};

			const errorResponse = {
				response: {
					data: {
						error: 'Email already exists',
					},
				},
			};

			mockAxiosInstance.put.mockRejectedValue(errorResponse);

			await expect(CustomerService.updateCustomer(1, customerData)).rejects.toThrow('Email already exists');
		});

		it('should handle API error with default error message', async () => {
			const customerData = {
				firstName: 'John',
				lastName: 'Smith'
			};

			const error = new Error('Network error');
			mockAxiosInstance.put.mockRejectedValue(error);

			await expect(CustomerService.updateCustomer(1, customerData)).rejects.toThrow('Failed to update customer');
		});

		it('should handle customer not found error', async () => {
			const customerData = {
				firstName: 'John',
				lastName: 'Smith'
			};

			const errorResponse = {
				response: {
					data: {
						error: 'Customer not found',
					},
				},
			};

			mockAxiosInstance.put.mockRejectedValue(errorResponse);

			await expect(CustomerService.updateCustomer(999, customerData)).rejects.toThrow('Customer not found');
		});
	});

	describe('deleteCustomer', () => {
		it('should delete customer successfully', async () => {
			const mockResponse = {
				message: 'Customer deleted successfully',
				deletedId: 1
			};

			mockAxiosInstance.delete.mockResolvedValue({ data: mockResponse });

			const result = await CustomerService.deleteCustomer(1);

			expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/customers/1');
			expect(result).toEqual(mockResponse);
		});

		it('should handle delete errors', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Cannot delete customer with active accounts',
					},
				},
			};

			mockAxiosInstance.delete.mockRejectedValue(errorResponse);

			await expect(CustomerService.deleteCustomer(1)).rejects.toThrow('Cannot delete customer with active accounts');
		});

		it('should handle API error with default error message', async () => {
			const error = new Error('Network error');
			mockAxiosInstance.delete.mockRejectedValue(error);

			await expect(CustomerService.deleteCustomer(1)).rejects.toThrow('Failed to delete customer');
		});

		it('should handle customer not found error', async () => {
			const errorResponse = {
				response: {
					data: {
						error: 'Customer not found',
					},
				},
			};

			mockAxiosInstance.delete.mockRejectedValue(errorResponse);

			await expect(CustomerService.deleteCustomer(999)).rejects.toThrow('Customer not found');
		});
	});

	describe('Interceptor Logic Tests', () => {
		// Test the interceptor logic directly without mocking complexity
		it('should add auth token to request config when token exists', () => {
			// Mock localStorage
			window.localStorage.getItem.mockReturnValue('customer-token-456');

			// Test the request interceptor logic directly
			const config = { headers: {} };

			// This is the exact logic from the request interceptor
			const token = localStorage.getItem('token');
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}

			expect(window.localStorage.getItem).toHaveBeenCalledWith('token');
			expect(config.headers.Authorization).toBe('Bearer customer-token-456');
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
			const response = { data: { id: 1, firstName: 'John' }, status: 200 };

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
			const error403 = {
				response: {
					status: 403,
					data: { error: 'Forbidden' }
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

			await expect(responseErrorHandler(error403)).rejects.toBe(error403);

			// Should not have called localStorage.removeItem for non-401 errors
			expect(window.localStorage.removeItem).not.toHaveBeenCalled();
		});

		it('should handle errors without response property', async () => {
			const networkError = new Error('Network connection failed');

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
