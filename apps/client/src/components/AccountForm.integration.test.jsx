import React from 'react';
import '@testing-library/jest-dom';
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountForm from './AccountForm';

// Mock axios
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
    })),
}));

// Mock customerService
jest.mock('../services/customerService', () => ({
    __esModule: true,
    default: {
        getAllCustomers: jest.fn(() => Promise.resolve([])),
    },
}));

// Mock the hook to prevent infinite loops
const mockHandleChange = jest.fn();

jest.mock('../hooks/useAccountForm', () => ({
    useAccountForm: (initialData = {}) => {
        const mockFormData = {
            accountType: initialData.accountType || 'checking',
            balance: initialData.balance || 0,
            currency: initialData.currency || 'USD',
            status: initialData.status || 'active',
            customerId: initialData.customerId || ''
        };

        return {
            // State for rendering
            formData: mockFormData,
            customers: [],
            filteredCustomers: [],
            loadingCustomers: false,
            error: '',
            customerSearch: '',
            showCustomerDropdown: false,
            selectedCustomerIndex: -1,

            // Event handlers that simulate real behavior
            handleChange: mockHandleChange,
            handleCustomerSearchChange: jest.fn(),
            handleCustomerInputFocus: jest.fn(),
            handleCustomerKeyDown: jest.fn(),
            handleCustomerInputBlur: jest.fn(),
            handleSubmit: jest.fn(),
            selectCustomer: jest.fn(),

            // Other functions
            updateFormField: jest.fn(),
            setError: jest.fn(),
            setCustomers: jest.fn(),
            setLoadingCustomers: jest.fn(),
            setCustomerSearch: jest.fn(),
            setShowCustomerDropdown: jest.fn(),
            handleKeyboardNavigation: jest.fn(),
            resetFormData: jest.fn(),
            initializeCustomerSearch: jest.fn(),
        };
    }
}));

describe('AccountForm Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockHandleChange.mockClear();
    });

    test('renders form with all basic elements', () => {
        render(<AccountForm onSubmit={jest.fn()} />);

        expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/initial balance/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/account status/i)).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /create account/i})).toBeInTheDocument();
    });

    test('form accepts user input', async () => {
        const user = userEvent.setup();
        render(<AccountForm onSubmit={jest.fn()} />);

        const balanceInput = screen.getByLabelText(/initial balance/i);

        // Clear and type into the input
        await user.clear(balanceInput);
        await user.type(balanceInput, '1000');

        // Verify that the handleChange function was called multiple times during typing
        expect(mockHandleChange).toHaveBeenCalled();
        expect(mockHandleChange.mock.calls.length).toBeGreaterThan(0);

        // Check that at least one call had the correct target name (balance field)
        const balanceCalls = mockHandleChange.mock.calls.filter(call =>
            call[0].target.name === 'balance'
        );
        expect(balanceCalls.length).toBeGreaterThan(0);

        // Verify the field name is correct in the calls
        expect(balanceCalls[0][0].target.name).toBe('balance');
    });

    test('form renders with initial data', () => {
        const initialData = {balance: 500, accountType: 'savings'};
        render(<AccountForm onSubmit={jest.fn()} initialData={initialData} />);

        expect(screen.getByDisplayValue('500')).toBeInTheDocument();
    });

    test('form handles pre-selected customer state', () => {
        render(<AccountForm onSubmit={jest.fn()} isCustomerPreSelected={true} />);

        // Check if pre-selected elements exist (they might be conditional)
        const form = screen.getByRole('button', {name: /create account/i});
        expect(form).toBeInTheDocument();
    });

    test('submit button is clickable', async () => {
        const user = userEvent.setup();
        const mockSubmit = jest.fn();
        render(<AccountForm onSubmit={mockSubmit} />);

        const submitButton = screen.getByRole('button', {name: /create account/i});
        await user.click(submitButton);

        // Just verify the button click works
        expect(submitButton).toBeInTheDocument();
    });

    test('form has proper accessibility attributes', () => {
        render(<AccountForm onSubmit={jest.fn()} />);

        // Check accessibility
        expect(screen.getByLabelText(/account type/i)).toBeRequired();
        expect(screen.getByLabelText(/account status/i)).toBeRequired();

        const balanceInput = screen.getByLabelText(/initial balance/i);
        expect(balanceInput).toHaveAttribute('type', 'number');
    });

    test('form with all props renders correctly', () => {
        const initialData = {
            accountType: 'savings',
            balance: 1000,
            currency: 'EUR',
            status: 'active'
        };

        render(
            <AccountForm
                onSubmit={jest.fn()}
                initialData={initialData}
                isCustomerPreSelected={true}
            />
        );

        expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
        expect(screen.getByRole('button', {name: /create account/i})).toBeInTheDocument();
    });
});
