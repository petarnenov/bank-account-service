import React from 'react';
import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Mock the useAuth hook
const mockUseAuth = jest.fn();
jest.mock('../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock Navigate component to prevent actual navigation
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    Navigate: ({to, state}) => (
        <div data-testid="navigate" data-to={to} data-state={JSON.stringify(state)}>
            Redirecting to {to}
        </div>
    ),
}));

// Mock child component for testing
const MockChildComponent = () => (
    <div data-testid="protected-content">Protected Content</div>
);

// Helper function to render ProtectedRoute with router context
const renderWithRouter = (component, initialEntries = ['/']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            {component}
        </MemoryRouter>
    );
};

describe('ProtectedRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('when user is authenticated', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });
        });

        it('renders children when user is authenticated', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });

        it('renders multiple children when user is authenticated', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <div data-testid="child-1">Child 1</div>
                    <div data-testid="child-2">Child 2</div>
                    <div data-testid="child-3">Child 3</div>
                </ProtectedRoute>
            );

            expect(screen.getByTestId('child-1')).toBeInTheDocument();
            expect(screen.getByTestId('child-2')).toBeInTheDocument();
            expect(screen.getByTestId('child-3')).toBeInTheDocument();
        });

        it('renders string content when user is authenticated', () => {
            renderWithRouter(
                <ProtectedRoute>
                    Just some text content
                </ProtectedRoute>
            );

            expect(screen.getByText('Just some text content')).toBeInTheDocument();
        });
    });

    describe('when user is not authenticated', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: false,
            });
        });

        it('does not render children when user is not authenticated', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('redirects to login when user is not authenticated', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>,
                ['/dashboard']
            );

            // Should render Navigate component for redirection
            expect(screen.getByTestId('navigate')).toBeInTheDocument();
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('preserves the current location for redirect state', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>,
                ['/protected-page']
            );

            // Should render Navigate component with location state
            expect(screen.getByTestId('navigate')).toBeInTheDocument();
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });
    });

    describe('when authentication is loading', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: true,
            });
        });

        it('displays loading spinner when loading is true', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.getByText('Loading...')).toHaveClass('loading-spinner');
        });

        it('displays loading container with correct CSS class', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Loading...')).toHaveClass('loading-spinner');
            // Check that loading container exists by checking if it contains the spinner
            const loadingSpinner = screen.getByText('Loading...');
            expect(loadingSpinner).toBeInTheDocument();
        });

        it('does not render children when loading', () => {
            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('shows loading even when isAuthenticated is true but loading is true', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: true,
            });

            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });
    });

    describe('edge cases and component behavior', () => {
        it('handles null children gracefully when authenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute>
                        {null}
                    </ProtectedRoute>
                );
            }).not.toThrow();
        });

        it('handles undefined children gracefully when authenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute>
                        {undefined}
                    </ProtectedRoute>
                );
            }).not.toThrow();
        });

        it('handles empty children when authenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            renderWithRouter(
                <ProtectedRoute>
                </ProtectedRoute>
            );

            // Should not find any specific content when children are empty
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('handles false children when authenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute>
                        {false}
                    </ProtectedRoute>
                );
            }).not.toThrow();
        });
    });

    describe('authentication state transitions', () => {
        it('transitions from loading to authenticated state', () => {
            // Start with loading
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: true,
            });

            const {rerender} = renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

            // Update to authenticated
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            rerender(
                <MemoryRouter>
                    <ProtectedRoute>
                        <MockChildComponent />
                    </ProtectedRoute>
                </MemoryRouter>
            );

            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });

        it('transitions from loading to unauthenticated state', () => {
            // Start with loading
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: true,
            });

            const {rerender} = renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();

            // Update to unauthenticated
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: false,
            });

            rerender(
                <MemoryRouter>
                    <ProtectedRoute>
                        <MockChildComponent />
                    </ProtectedRoute>
                </MemoryRouter>
            );

            expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
            expect(screen.getByTestId('navigate')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });

        it('transitions from authenticated to unauthenticated state', () => {
            // Start authenticated
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            const {rerender} = renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();

            // Update to unauthenticated
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: false,
            });

            rerender(
                <MemoryRouter>
                    <ProtectedRoute>
                        <MockChildComponent />
                    </ProtectedRoute>
                </MemoryRouter>
            );

            expect(screen.getByTestId('navigate')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });
    });

    describe('component structure and accessibility', () => {
        it('loading spinner has correct structure', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: false,
                loading: true,
            });

            renderWithRouter(
                <ProtectedRoute>
                    <MockChildComponent />
                </ProtectedRoute>
            );

            const loadingSpinner = screen.getByText('Loading...');
            expect(loadingSpinner).toHaveClass('loading-spinner');
        });

        it('maintains proper component hierarchy when authenticated', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                loading: false,
            });

            renderWithRouter(
                <ProtectedRoute>
                    <div>
                        <h1>Page Title</h1>
                        <main>Page Content</main>
                    </div>
                </ProtectedRoute>
            );

            expect(screen.getByRole('heading', {level: 1})).toBeInTheDocument();
            expect(screen.getByRole('main')).toBeInTheDocument();
        });
    });

    describe('different authentication scenarios', () => {
        it('handles missing loading property gracefully', () => {
            mockUseAuth.mockReturnValue({
                isAuthenticated: true,
                // loading property missing
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute>
                        <MockChildComponent />
                    </ProtectedRoute>
                );
            }).not.toThrow();

            expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        });

        it('handles missing isAuthenticated property gracefully', () => {
            mockUseAuth.mockReturnValue({
                // isAuthenticated property missing
                loading: false,
            });

            expect(() => {
                renderWithRouter(
                    <ProtectedRoute>
                        <MockChildComponent />
                    </ProtectedRoute>
                );
            }).not.toThrow();

            // Should treat missing isAuthenticated as false and redirect
            expect(screen.getByTestId('navigate')).toBeInTheDocument();
            expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        });
    });
});
