import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage before imports
const localStorageMock = {
	getItem: jest.fn(),
	setItem: jest.fn(),
	removeItem: jest.fn(),
	clear: jest.fn(),
};

// Replace the global localStorage
Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true,
});// Test component that uses the auth context
const TestComponent = () => {
	const auth = useAuth();

	const handleLogin = async () => {
		await auth.login('testuser', 'password');
	};

	const handleRegister = async () => {
		await auth.register({ username: 'newuser', password: 'password' });
	};

	return (
		<div>
			<div data-testid="user">{auth.user ? JSON.stringify(auth.user) : 'null'}</div>
			<div data-testid="token">{auth.token || 'null'}</div>
			<div data-testid="loading">{auth.loading.toString()}</div>
			<div data-testid="isAuthenticated">{auth.isAuthenticated.toString()}</div>
			<button onClick={handleLogin} data-testid="login-btn">
				Login
			</button>
			<button onClick={handleRegister} data-testid="register-btn">
				Register
			</button>
			<button onClick={auth.logout} data-testid="logout-btn">
				Logout
			</button>
		</div>
	);
};

// Component to test error when useAuth is used outside provider
const TestComponentWithoutProvider = () => {
	const auth = useAuth();
	return <div>{auth.user}</div>;
};

describe('AuthContext', () => {
	// Mock console.error to avoid noise in tests
	const originalConsoleError = console.error;
	beforeAll(() => {
		console.error = jest.fn();
	});

	afterAll(() => {
		console.error = originalConsoleError;
	});

	beforeEach(() => {
		jest.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
		fetch.mockClear();

		// Set up environment variable
		process.env.REACT_APP_API_URL = 'http://localhost:5001';
	});

	describe('useAuth hook', () => {
		it('should throw error when used outside AuthProvider', () => {
			// Temporarily suppress console.error for this test
			const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

			expect(() => {
				render(<TestComponentWithoutProvider />);
			}).toThrow('useAuth must be used within an AuthProvider');

			consoleSpy.mockRestore();
		});
	});

	describe('AuthProvider', () => {
		it('should initialize with default values when no stored data', async () => {
			localStorageMock.getItem.mockReturnValue(null);

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			// Wait for initialization to complete
			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			expect(screen.getByTestId('user')).toHaveTextContent('null');
			expect(screen.getByTestId('token')).toHaveTextContent('null');
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});

		it('should initialize with stored user data when token is valid', async () => {
			const mockUser = { id: 1, username: 'testuser' };
			const mockToken = 'valid-token';

			localStorageMock.getItem
				.mockReturnValueOnce(mockToken) // First call for token in useState
				.mockReturnValueOnce(mockToken) // Second call in useEffect
				.mockReturnValueOnce(JSON.stringify(mockUser)); // Third call for user

			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockUser,
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
			});

			expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

			// Verify API call was made
			expect(fetch).toHaveBeenCalledWith('http://localhost:5001/api/auth/profile', {
				headers: {
					'Authorization': `Bearer ${mockToken}`
				}
			});
		});

		it('should clear stored data when token is invalid', async () => {
			const mockToken = 'invalid-token';
			const mockUser = { id: 1, username: 'testuser' };

			localStorageMock.getItem
				.mockReturnValueOnce(mockToken)
				.mockReturnValueOnce(mockToken)
				.mockReturnValueOnce(JSON.stringify(mockUser));

			fetch.mockResolvedValueOnce({
				ok: false,
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			expect(screen.getByTestId('user')).toHaveTextContent('null');
			expect(screen.getByTestId('token')).toHaveTextContent('null');
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

			// Verify localStorage was cleared
			await waitFor(() => {
				expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
			});
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
		});

		it('should handle network error during initialization', async () => {
			const mockToken = 'some-token';
			const mockUser = { id: 1, username: 'testuser' };

			localStorageMock.getItem
				.mockReturnValueOnce(mockToken)
				.mockReturnValueOnce(mockToken)
				.mockReturnValueOnce(JSON.stringify(mockUser));

			fetch.mockRejectedValueOnce(new Error('Network error'));

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			expect(screen.getByTestId('user')).toHaveTextContent('null');
			expect(screen.getByTestId('token')).toHaveTextContent('null');

			// Verify localStorage was cleared
			await waitFor(() => {
				expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
			});
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
		});
	});

	describe('login function', () => {
		it('should login successfully with valid credentials', async () => {
			const mockUser = { id: 1, username: 'testuser' };
			const mockToken = 'auth-token';

			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: mockUser, token: mockToken }),
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			// Wait for initial loading to complete
			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('login-btn'));

			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
			});

			expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

			// Verify localStorage was updated
			await waitFor(() => {
				expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
			});
			expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));

			// Verify API call
			expect(fetch).toHaveBeenCalledWith('http://localhost:5001/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username: 'testuser', password: 'password' }),
			});
		});

		it('should handle login failure with invalid credentials', async () => {
			fetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'Invalid credentials' }),
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('login-btn'));

			// User should remain null after failed login
			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent('null');
			});

			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});

		it('should handle network error during login', async () => {
			fetch.mockRejectedValueOnce(new Error('Network error'));

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('login-btn'));

			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent('null');
			});

			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});
	});

	describe('register function', () => {
		it('should register successfully with valid data', async () => {
			const mockUser = { id: 1, username: 'newuser' };
			const mockToken = 'auth-token';

			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: mockUser, token: mockToken }),
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('register-btn'));

			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
			});

			expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');

			// Verify localStorage was updated
			await waitFor(() => {
				expect(localStorageMock.setItem).toHaveBeenCalledWith('token', mockToken);
			});
			expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));

			// Verify API call
			expect(fetch).toHaveBeenCalledWith('http://localhost:5001/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ username: 'newuser', password: 'password' }),
			});
		});

		it('should handle registration failure', async () => {
			fetch.mockResolvedValueOnce({
				ok: false,
				json: async () => ({ error: 'Username already exists' }),
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('register-btn'));

			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent('null');
			});

			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});

		it('should handle network error during registration', async () => {
			fetch.mockRejectedValueOnce(new Error('Network error'));

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('register-btn'));

			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent('null');
			});

			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});
	});

	describe('logout function', () => {
		it('should logout and clear all data', async () => {
			const mockUser = { id: 1, username: 'testuser' };
			const mockToken = 'auth-token';

			// Mock successful login first
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ user: mockUser, token: mockToken }),
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			// Wait for initial loading
			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			// Login first
			const user = userEvent.setup();
			await user.click(screen.getByTestId('login-btn'));

			// Wait for login to complete
			await waitFor(() => {
				expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true');
			});

			// Now logout
			await user.click(screen.getByTestId('logout-btn'));

			expect(screen.getByTestId('user')).toHaveTextContent('null');
			expect(screen.getByTestId('token')).toHaveTextContent('null');
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');

			// Verify localStorage was cleared
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
			expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
		});
	});

	describe('context value', () => {
		it('should provide all expected methods and properties', async () => {
			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			// All elements should be present, indicating all context values are available
			expect(screen.getByTestId('user')).toBeInTheDocument();
			expect(screen.getByTestId('token')).toBeInTheDocument();
			expect(screen.getByTestId('loading')).toBeInTheDocument();
			expect(screen.getByTestId('isAuthenticated')).toBeInTheDocument();
			expect(screen.getByTestId('login-btn')).toBeInTheDocument();
			expect(screen.getByTestId('register-btn')).toBeInTheDocument();
			expect(screen.getByTestId('logout-btn')).toBeInTheDocument();
		});
	});

	describe('edge cases', () => {
		it('should handle case when stored user data is invalid JSON', async () => {
			const mockToken = 'valid-token';

			localStorageMock.getItem
				.mockReturnValueOnce(mockToken)
				.mockReturnValueOnce(mockToken)
				.mockReturnValueOnce('invalid-json{');

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			expect(screen.getByTestId('user')).toHaveTextContent('null');
			expect(screen.getByTestId('token')).toHaveTextContent('null');
			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});

		it('should not make API call when no token is stored', async () => {
			localStorageMock.getItem.mockReturnValue(null);

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			expect(fetch).not.toHaveBeenCalled();
		});

		it('should handle login response with missing user data', async () => {
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ token: 'some-token' }), // Missing user
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('login-btn'));

			// Should not update state if response is invalid
			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent('null');
			});

			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});

		it('should handle register response with missing user data', async () => {
			fetch.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ token: 'some-token' }), // Missing user
			});

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId('loading')).toHaveTextContent('false');
			});

			const user = userEvent.setup();
			await user.click(screen.getByTestId('register-btn'));

			// Should not update state if response is invalid
			await waitFor(() => {
				expect(screen.getByTestId('user')).toHaveTextContent('null');
			});

			expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false');
		});
	});
});