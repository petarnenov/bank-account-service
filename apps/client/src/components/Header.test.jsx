import React from 'react';
import '@testing-library/jest-dom';
import {render, screen, fireEvent} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import Header from './Header';

// Mock the useAuth hook
const mockLogout = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
}));

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Wrapper component to provide Router context
const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Header', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set default mock return value
        mockUseAuth.mockReturnValue({
            user: {
                firstName: 'John',
                username: 'john.doe',
                id: 'user123'
            },
            logout: mockLogout,
            isAuthenticated: true,
        });
    });

    describe('when user is authenticated', () => {
        it('renders the app title with home link', () => {
            renderWithRouter(<Header />);

            const titleLink = screen.getByRole('link', {name: /bank account service/i});
            expect(titleLink).toBeInTheDocument();
            expect(titleLink).toHaveAttribute('href', '/');
        });

        it('renders authenticated navigation links', () => {
            renderWithRouter(<Header />);

            expect(screen.getByRole('link', {name: /dashboard/i})).toBeInTheDocument();
            expect(screen.getByRole('link', {name: /customers/i})).toBeInTheDocument();
            expect(screen.getByRole('link', {name: /create account/i})).toBeInTheDocument();
        });

        it('displays user greeting with first name', () => {
            renderWithRouter(<Header />);

            expect(screen.getByText('Welcome, John!')).toBeInTheDocument();
        });

        it('renders logout button and handles click', () => {
            renderWithRouter(<Header />);

            const logoutButton = screen.getByRole('button', {name: /logout/i});
            expect(logoutButton).toBeInTheDocument();

            fireEvent.click(logoutButton);

            expect(mockLogout).toHaveBeenCalledTimes(1);
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    describe('when user is not authenticated', () => {
        beforeEach(() => {
            mockUseAuth.mockReturnValue({
                user: null,
                logout: mockLogout,
                isAuthenticated: false,
            });
        });

        it('renders login and register links', () => {
            renderWithRouter(<Header />);

            expect(screen.getByRole('link', {name: /login/i})).toBeInTheDocument();
            expect(screen.getByRole('link', {name: /register/i})).toBeInTheDocument();
        });

        it('does not render authenticated navigation links', () => {
            renderWithRouter(<Header />);

            expect(screen.queryByRole('link', {name: /dashboard/i})).not.toBeInTheDocument();
            expect(screen.queryByRole('link', {name: /customers/i})).not.toBeInTheDocument();
            expect(screen.queryByRole('link', {name: /create account/i})).not.toBeInTheDocument();
        });

        it('does not render logout button', () => {
            renderWithRouter(<Header />);

            expect(screen.queryByRole('button', {name: /logout/i})).not.toBeInTheDocument();
        });
    });

    describe('component structure', () => {
        it('has proper semantic structure', () => {
            renderWithRouter(<Header />);

            const header = screen.getByRole('banner');
            expect(header).toHaveClass('app-header');

            const nav = screen.getByRole('navigation');
            expect(nav).toHaveClass('header-nav');

            const heading = screen.getByRole('heading', {level: 1});
            expect(heading).toBeInTheDocument();
        });
    });

    describe('edge cases and user variations', () => {
        it('displays username when firstName is not available', () => {
            mockUseAuth.mockReturnValue({
                user: {
                    username: 'jane.doe',
                    id: 'user456'
                },
                logout: mockLogout,
                isAuthenticated: true,
            });

            renderWithRouter(<Header />);

            expect(screen.getByText('Welcome, jane.doe!')).toBeInTheDocument();
        });

        it('handles empty user object gracefully', () => {
            mockUseAuth.mockReturnValue({
                user: {
                    id: 'user789'
                    // No firstName or username
                },
                logout: mockLogout,
                isAuthenticated: true,
            });

            renderWithRouter(<Header />);

            expect(screen.getByText('Welcome, !')).toBeInTheDocument();
        });

        it('handles null user when authenticated', () => {
            mockUseAuth.mockReturnValue({
                user: null,
                logout: mockLogout,
                isAuthenticated: true,
            });

            renderWithRouter(<Header />);

            // Should still render authenticated navigation
            expect(screen.getByRole('link', {name: /dashboard/i})).toBeInTheDocument();
            expect(screen.getByText('Welcome, !')).toBeInTheDocument();
        });
    });
});
