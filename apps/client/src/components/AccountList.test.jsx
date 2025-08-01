import React from 'react';
import '@testing-library/jest-dom';
import {render, screen, fireEvent} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import AccountList from './AccountList';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

// Mock AccountCard component to simplify testing
jest.mock('./AccountCard', () => {
    return function MockAccountCard({account, onClick}) {
        return (
            <div
                data-testid={`account-card-${account.id}`}
                onClick={() => onClick(account.id)}
                className="mock-account-card"
            >
                <span>{account.accountType}</span>
                <span>{account.accountNumber}</span>
                <span>${account.balance}</span>
            </div>
        );
    };
});

const mockAccounts = [
    {
        id: 'acc1',
        accountType: 'checking',
        accountNumber: '123456789',
        balance: 1500.5,
        currency: 'USD',
        status: 'active',
    },
    {
        id: 'acc2',
        accountType: 'savings',
        accountNumber: '987654321',
        balance: 2500.75,
        currency: 'USD',
        status: 'active',
    },
];

// Wrapper component to provide Router context
const renderWithRouter = (component) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('AccountList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('rendering with accounts', () => {
        it('renders all accounts when provided with account data', () => {
            renderWithRouter(<AccountList accounts={mockAccounts} />);

            expect(screen.getByTestId('account-card-acc1')).toBeInTheDocument();
            expect(screen.getByTestId('account-card-acc2')).toBeInTheDocument();
        });

        it('renders the correct number of account cards', () => {
            renderWithRouter(<AccountList accounts={mockAccounts} />);

            const accountCards = screen.getAllByTestId(/account-card-/);
            expect(accountCards).toHaveLength(2);
        });
    });

    describe('rendering without accounts', () => {
        it('renders "No accounts found" message when accounts array is empty', () => {
            renderWithRouter(<AccountList accounts={[]} />);

            expect(screen.getByText('No accounts found')).toBeInTheDocument();
            expect(screen.getByText('No accounts found')).toHaveClass('no-accounts');
        });

        it('renders "No accounts found" message when accounts is null', () => {
            renderWithRouter(<AccountList accounts={null} />);

            expect(screen.getByText('No accounts found')).toBeInTheDocument();
        });
    });

    describe('navigation functionality', () => {
        it('navigates to account detail page when account card is clicked', () => {
            renderWithRouter(<AccountList accounts={mockAccounts} />);

            const firstAccountCard = screen.getByTestId('account-card-acc1');
            fireEvent.click(firstAccountCard);

            expect(mockNavigate).toHaveBeenCalledWith('/account/acc1');
        });

        it('navigates with correct account ID for different accounts', () => {
            renderWithRouter(<AccountList accounts={mockAccounts} />);

            // Click second account
            const secondAccountCard = screen.getByTestId('account-card-acc2');
            fireEvent.click(secondAccountCard);

            expect(mockNavigate).toHaveBeenCalledWith('/account/acc2');
        });

        it('handles multiple account clicks correctly', () => {
            renderWithRouter(<AccountList accounts={mockAccounts} />);

            const firstAccountCard = screen.getByTestId('account-card-acc1');
            const secondAccountCard = screen.getByTestId('account-card-acc2');

            fireEvent.click(firstAccountCard);
            fireEvent.click(secondAccountCard);

            expect(mockNavigate).toHaveBeenCalledTimes(2);
            expect(mockNavigate).toHaveBeenNthCalledWith(1, '/account/acc1');
            expect(mockNavigate).toHaveBeenNthCalledWith(2, '/account/acc2');
        });
    });

    describe('edge cases and component updates', () => {
        it('handles single account correctly', () => {
            const singleAccount = [mockAccounts[0]];

            renderWithRouter(<AccountList accounts={singleAccount} />);

            expect(screen.getByTestId('account-card-acc1')).toBeInTheDocument();
            expect(screen.getAllByTestId(/account-card-/)).toHaveLength(1);
        });

        it('updates when accounts prop changes', () => {
            const {rerender} = renderWithRouter(<AccountList accounts={[mockAccounts[0]]} />);

            expect(screen.getAllByTestId(/account-card-/)).toHaveLength(1);

            // Update with more accounts
            rerender(
                <BrowserRouter>
                    <AccountList accounts={mockAccounts} />
                </BrowserRouter>
            );

            expect(screen.getAllByTestId(/account-card-/)).toHaveLength(2);
        });

        it('updates when switching from empty to populated accounts', () => {
            const {rerender} = renderWithRouter(<AccountList accounts={[]} />);

            expect(screen.getByText('No accounts found')).toBeInTheDocument();

            // Update with accounts
            rerender(
                <BrowserRouter>
                    <AccountList accounts={mockAccounts} />
                </BrowserRouter>
            );

            expect(screen.queryByText('No accounts found')).not.toBeInTheDocument();
            expect(screen.getAllByTestId(/account-card-/)).toHaveLength(2);
        });

        it('renders "No accounts found" message when no accounts prop is provided', () => {
            renderWithRouter(<AccountList />);

            expect(screen.getByText('No accounts found')).toBeInTheDocument();
            expect(screen.getByText('No accounts found')).toHaveClass('no-accounts');
        });
    });
});
