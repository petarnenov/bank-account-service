import React from 'react';
import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountForm from './AccountForm';

// Mock axios to prevent import issues
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Mock the useAccountForm hook
jest.mock('../hooks/useAccountForm', () => ({
    useAccountForm: jest.fn(),
}));

const {useAccountForm} = require('../hooks/useAccountForm');

describe('AccountForm', () => {
    const mockUseAccountForm = {
        formData: {
            accountType: 'checking',
            balance: 0,
            currency: 'USD',
            status: 'active',
            customerId: ''
        },
        loadingCustomers: false,
        error: '',
        customerSearch: '',
        showCustomerDropdown: false,
        filteredCustomers: [],
        selectedCustomerIndex: -1,
        handleChange: jest.fn(),
        handleCustomerSearchChange: jest.fn(),
        handleCustomerInputFocus: jest.fn(),
        handleCustomerKeyDown: jest.fn(),
        handleCustomerInputBlur: jest.fn(),
        handleSubmit: jest.fn(),
        selectCustomer: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAccountForm.mockReturnValue(mockUseAccountForm);
    });

    describe('Form Rendering', () => {
        test('renders all form fields with correct default values', () => {
            render(<AccountForm onSubmit={jest.fn()} />);

            // Check that form elements are present
            expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Checking'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Savings'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Credit'})).toBeInTheDocument();

            expect(screen.getByLabelText(/initial balance/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue('0')).toBeInTheDocument();

            expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'USD'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'EUR'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'GBP'})).toBeInTheDocument();

            expect(screen.getByLabelText(/account status/i)).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Active'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Inactive'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Frozen'})).toBeInTheDocument();

            // Customer field - check for customer search input since the label points to customerId but input is customerSearch  
            expect(screen.getByPlaceholderText(/search customers by name or email/i)).toBeInTheDocument();
            expect(screen.getByRole('button', {name: /create account/i})).toBeInTheDocument();
        });

        test('renders with initial data when provided', () => {
            const initialData = {
                accountType: 'savings',
                balance: 1000,
                currency: 'EUR',
                status: 'inactive'
            };

            useAccountForm.mockReturnValue({
                ...mockUseAccountForm,
                formData: initialData
            });

            render(<AccountForm onSubmit={jest.fn()} initialData={initialData} />);

            // Check that the balance input shows the correct value (it has a value attribute)
            expect(screen.getByDisplayValue('1000')).toBeInTheDocument();

            // For selects, verify the form structure is rendered correctly
            expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/account status/i)).toBeInTheDocument();

            // Verify options are available
            expect(screen.getByRole('option', {name: 'Savings'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'EUR'})).toBeInTheDocument();
            expect(screen.getByRole('option', {name: 'Inactive'})).toBeInTheDocument();
        });

        test('shows pre-selected badge when customer is pre-selected', () => {
            render(<AccountForm onSubmit={jest.fn()} isCustomerPreSelected={true} />);

            expect(screen.getByText('Pre-selected')).toBeInTheDocument();
            expect(screen.getByPlaceholderText(/customer pre-selected/i)).toBeInTheDocument();
        });
    });

    describe('Form Interactions', () => {
        test('calls handleChange when form fields are changed', async () => {
            const user = userEvent.setup();
            render(<AccountForm onSubmit={jest.fn()} />);

            const accountTypeSelect = screen.getByLabelText(/account type/i);
            await user.selectOptions(accountTypeSelect, 'savings');
            expect(mockUseAccountForm.handleChange).toHaveBeenCalled();

            const balanceInput = screen.getByLabelText(/initial balance/i);
            await user.clear(balanceInput);
            await user.type(balanceInput, '100');
            expect(mockUseAccountForm.handleChange).toHaveBeenCalled();
        });
    });

    describe('Customer Search', () => {
        test('calls customer search handlers', async () => {
            const user = userEvent.setup();
            render(<AccountForm onSubmit={jest.fn()} />);

            const customerInput = screen.getByPlaceholderText(/search customers/i);

            await user.click(customerInput);
            expect(mockUseAccountForm.handleCustomerInputFocus).toHaveBeenCalled();

            await user.type(customerInput, 'John');
            expect(mockUseAccountForm.handleCustomerSearchChange).toHaveBeenCalled();
        });

        test('disables customer input when pre-selected', () => {
            render(<AccountForm onSubmit={jest.fn()} isCustomerPreSelected={true} />);

            const customerInput = screen.getByPlaceholderText(/customer pre-selected/i);
            expect(customerInput).toBeDisabled();
        });
    });

    describe('Customer Dropdown', () => {
        const mockCustomers = [
            {id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com'},
            {id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com'}
        ];

        test('renders customer dropdown when visible', () => {
            useAccountForm.mockReturnValue({
                ...mockUseAccountForm,
                showCustomerDropdown: true,
                filteredCustomers: mockCustomers
            });

            render(<AccountForm onSubmit={jest.fn()} />);

            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
            expect(screen.getByText('Jane Smith')).toBeInTheDocument();
            expect(screen.getByText('jane@example.com')).toBeInTheDocument();
        });

        test('shows no results message when no customers found', () => {
            useAccountForm.mockReturnValue({
                ...mockUseAccountForm,
                showCustomerDropdown: true,
                filteredCustomers: [],
                customerSearch: 'xyz'
            });

            render(<AccountForm onSubmit={jest.fn()} />);

            expect(screen.getByText('No customers found matching "xyz"')).toBeInTheDocument();
        });

        test('calls selectCustomer when option is clicked', async () => {
            const user = userEvent.setup();
            useAccountForm.mockReturnValue({
                ...mockUseAccountForm,
                showCustomerDropdown: true,
                filteredCustomers: mockCustomers
            });

            render(<AccountForm onSubmit={jest.fn()} />);

            await user.click(screen.getByText('John Doe'));
            expect(mockUseAccountForm.selectCustomer).toHaveBeenCalledWith(mockCustomers[0]);
        });
    });

    describe('Loading and Error States', () => {
        test('shows loading message when customers are loading', () => {
            useAccountForm.mockReturnValue({
                ...mockUseAccountForm,
                loadingCustomers: true
            });

            render(<AccountForm onSubmit={jest.fn()} />);

            expect(screen.getByText('Loading customers...')).toBeInTheDocument();
            expect(screen.queryByPlaceholderText(/search customers/i)).not.toBeInTheDocument();
        });

        test('shows error message when there is an error', () => {
            const errorMessage = 'Failed to load customers';
            useAccountForm.mockReturnValue({
                ...mockUseAccountForm,
                error: errorMessage
            });

            render(<AccountForm onSubmit={jest.fn()} />);

            expect(screen.getByText(errorMessage)).toBeInTheDocument();
            expect(screen.queryByPlaceholderText(/search customers/i)).not.toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        test('calls handleSubmit when form is submitted', async () => {
            const user = userEvent.setup();
            const mockOnSubmit = jest.fn();

            render(<AccountForm onSubmit={mockOnSubmit} />);

            await user.click(screen.getByRole('button', {name: /create account/i}));

            expect(mockUseAccountForm.handleSubmit).toHaveBeenCalledWith(
                expect.any(Object),
                mockOnSubmit
            );
        });
    });

    describe('Accessibility', () => {
        test('has proper labels and attributes', () => {
            render(<AccountForm onSubmit={jest.fn()} />);

            expect(screen.getByLabelText(/account type/i)).toBeRequired();
            expect(screen.getByLabelText(/account status/i)).toBeRequired();

            const balanceInput = screen.getByLabelText(/initial balance/i);
            expect(balanceInput).toHaveAttribute('type', 'number');
            expect(balanceInput).toHaveAttribute('step', '0.01');
            expect(balanceInput).toHaveAttribute('min', '0');

            const customerInput = screen.getByPlaceholderText(/search customers/i);
            expect(customerInput).toHaveAttribute('autoComplete', 'off');
        });
    });

    describe('Hook Integration', () => {
        test('initializes hook with correct parameters', () => {
            const initialData = {accountType: 'savings'};
            render(<AccountForm onSubmit={jest.fn()} initialData={initialData} isCustomerPreSelected={true} />);

            expect(useAccountForm).toHaveBeenCalledWith(initialData, true);
        });

        test('initializes hook with default parameters', () => {
            render(<AccountForm onSubmit={jest.fn()} />);

            expect(useAccountForm).toHaveBeenCalledWith({}, false);
        });
    });
});
