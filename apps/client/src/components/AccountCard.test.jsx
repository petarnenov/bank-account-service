import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import AccountCard from './AccountCard';

// Mock AccountService to avoid axios import and side effects
jest.mock('../services/accountService', () => ({
	__esModule: true,
	default: {
		updateAccountStatus: jest.fn(() => Promise.resolve()),
	},
}));

const mockAccount = {
	id: 'acc1',
	accountType: 'checking',
	accountNumber: '123456789',
	balance: 1500.5,
	currency: 'USD',
	status: 'active',
};

describe('AccountCard', () => {
	it('renders account type, number, and balance', () => {
		render(<AccountCard account={mockAccount} onClick={() => { }} />);
		expect(screen.getByText(/CHECKING/)).toBeInTheDocument();
		expect(screen.getByText(/Account: 123456789/)).toBeInTheDocument();
		expect(screen.getByText('$1,500.50')).toBeInTheDocument();
	});

	it('calls onClick with account id when card is clicked', () => {
		const handleClick = jest.fn();
		render(<AccountCard account={mockAccount} onClick={handleClick} />);
		fireEvent.click(screen.getByText(/CHECKING/));
		expect(handleClick).toHaveBeenCalledWith('acc1');
	});

	it('does not call onClick when status dropdown is clicked', () => {
		const handleClick = jest.fn();
		render(<AccountCard account={mockAccount} onClick={handleClick} />);
		fireEvent.mouseDown(screen.getByRole('combobox'));
		expect(handleClick).not.toHaveBeenCalled();
	});

	it('shows correct status in dropdown', () => {
		render(<AccountCard account={{ ...mockAccount, status: 'frozen' }} onClick={() => { }} />);
		expect(screen.getByDisplayValue('FROZEN')).toBeInTheDocument();
	});
});
