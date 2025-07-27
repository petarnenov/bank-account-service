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

describe('AccountCard integration', () => {
	// Note: window.location.reload cannot be mocked or asserted in jsdom (read-only property)

	it('calls AccountService.updateAccountStatus on status change', async () => {
		const AccountService = require('../services/accountService').default;

		render(<AccountCard account={mockAccount} onClick={() => { }} />);
		const select = screen.getByRole('combobox');
		fireEvent.change(select, { target: { value: 'inactive' } });
		await Promise.resolve();
		expect(AccountService.updateAccountStatus).toHaveBeenCalledWith('acc1', 'inactive');
		// window.location.reload cannot be reliably asserted in jsdom
	});

	it('shows Modal if updateAccountStatus fails', async () => {
		const AccountService = require('../services/accountService').default;
		AccountService.updateAccountStatus.mockImplementationOnce(() => Promise.reject('fail'));

		render(<AccountCard account={mockAccount} onClick={() => { }} />);
		const select = screen.getByRole('combobox');
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
		fireEvent.change(select, { target: { value: 'frozen' } });
		await Promise.resolve();
		// Modal should appear with error message (wait for it)
		expect(await screen.findByText('Failed to update account status. Please try again.')).toBeInTheDocument();
		// Modal close button should be present
		expect(screen.getByText('Close')).toBeInTheDocument();
		consoleErrorSpy.mockRestore();
	});
});
