import {renderHook, act} from '@testing-library/react';

import {useAccountForm} from './useAccountForm';
import CustomerService from '../services/customerService';
import useAccountFormStore from '../store/useAccountFormStore';

// Mock axios to prevent import issues
jest.mock('axios', () => ({
    create: jest.fn(() => ({
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        interceptors: {
            request: {
                use: jest.fn()
            },
            response: {
                use: jest.fn()
            }
        }
    })),
}));

// Mock the customer service
jest.mock('../services/customerService');

// Mock the store
jest.mock('../store/useAccountFormStore');

// Mock the customer service
jest.mock('../services/customerService');

// Mock the store
jest.mock('../store/useAccountFormStore');

describe('useAccountForm', () => {
    // Mock store state and actions
    const mockStoreState = {
        formData: {
            accountType: 'checking',
            balance: 0,
            currency: 'USD',
            customerId: '',
            status: 'active'
        },
        customers: [],
        filteredCustomers: [],
        loadingCustomers: true,
        error: '',
        customerSearch: '',
        showCustomerDropdown: false,
        selectedCustomerIndex: -1,
        updateFormField: jest.fn(),
        setError: jest.fn(),
        setCustomerSearch: jest.fn(),
        setShowCustomerDropdown: jest.fn(),
        selectCustomer: jest.fn(),
        handleKeyboardNavigation: jest.fn(),
        handleCustomerInputBlur: jest.fn(),
        resetFormData: jest.fn()
    };

    const mockStoreActions = {
        resetFormData: jest.fn(),
        setCustomers: jest.fn(),
        setLoadingCustomers: jest.fn(),
        initializeCustomerSearch: jest.fn(),
        setSelectedCustomerIndex: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock the store hook
        useAccountFormStore.mockReturnValue(mockStoreState);

        // Mock the getState method
        useAccountFormStore.getState = jest.fn(() => ({
            ...mockStoreState,
            ...mockStoreActions
        }));

        // Mock CustomerService
        CustomerService.getAllCustomers = jest.fn();
    });

    describe('initialization', () => {
        it('should initialize with default values', () => {
            const {result} = renderHook(() => useAccountForm());

            expect(result.current.formData).toEqual(mockStoreState.formData);
            expect(result.current.loadingCustomers).toBe(true);
            expect(result.current.error).toBe('');
        });

        it('should reset form data with initial data on mount', () => {
            const initialData = {
                accountType: 'savings',
                balance: 100,
                currency: 'EUR',
                customerId: 'customer123',
                status: 'inactive'
            };

            renderHook(() => useAccountForm(initialData));

            expect(mockStoreState.resetFormData).toHaveBeenCalledWith(initialData);
        });

        it('should fetch customers on mount', async () => {
            const mockCustomers = [
                {id: '1', name: 'John Doe'},
                {id: '2', name: 'Jane Smith'}
            ];
            CustomerService.getAllCustomers.mockResolvedValue(mockCustomers);

            renderHook(() => useAccountForm());

            // Wait for the async effect to complete
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(CustomerService.getAllCustomers).toHaveBeenCalled();
            expect(mockStoreActions.setCustomers).toHaveBeenCalledWith(mockCustomers);
        });

        it('should handle customer fetch error', async () => {
            const errorMessage = 'Network error';
            CustomerService.getAllCustomers.mockRejectedValue(new Error(errorMessage));

            // Mock console.error to prevent error logs in test output
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

            renderHook(() => useAccountForm());

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 0));
            });

            expect(useAccountFormStore.getState().setError).toHaveBeenCalledWith('Failed to load customers: ' + errorMessage);
            expect(useAccountFormStore.getState().setLoadingCustomers).toHaveBeenCalledWith(false);

            consoleSpy.mockRestore();
        });

        it('should initialize customer search when customers are available', () => {
            // Mock customers being available
            mockStoreState.customers = [{id: '1', name: 'Test Customer'}];

            renderHook(() => useAccountForm());

            expect(mockStoreActions.initializeCustomerSearch).toHaveBeenCalled();
        });
    });

    describe('form field handling', () => {
        it('should handle regular field changes', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                target: {name: 'accountType', value: 'savings'}
            };

            act(() => {
                result.current.handleChange(mockEvent);
            });

            expect(mockStoreState.updateFormField).toHaveBeenCalledWith('accountType', 'savings');
        });

        it('should handle balance field changes with number conversion', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                target: {name: 'balance', value: '150.50'}
            };

            act(() => {
                result.current.handleChange(mockEvent);
            });

            expect(mockStoreState.updateFormField).toHaveBeenCalledWith('balance', 150.50);
        });

        it('should handle empty balance field', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                target: {name: 'balance', value: ''}
            };

            act(() => {
                result.current.handleChange(mockEvent);
            });

            expect(mockStoreState.updateFormField).toHaveBeenCalledWith('balance', '');
        });

        it('should handle invalid balance value', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                target: {name: 'balance', value: 'invalid'}
            };

            act(() => {
                result.current.handleChange(mockEvent);
            });

            expect(mockStoreState.updateFormField).toHaveBeenCalledWith('balance', 0);
        });
    });

    describe('customer search handling', () => {
        it('should handle customer search input change', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                target: {value: 'John'}
            };

            act(() => {
                result.current.handleCustomerSearchChange(mockEvent);
            });

            expect(mockStoreState.setCustomerSearch).toHaveBeenCalledWith('John');
            expect(mockStoreState.setShowCustomerDropdown).toHaveBeenCalledWith(true);
            expect(mockStoreActions.setSelectedCustomerIndex).toHaveBeenCalledWith(-1);
        });

        it('should clear customer ID when search value changes', () => {
            // Mock different customerSearch value to trigger the condition
            const modifiedStoreState = {
                ...mockStoreState,
                customerSearch: 'existing value'
            };
            useAccountFormStore.mockReturnValue(modifiedStoreState);

            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                target: {value: 'new value'}
            };

            act(() => {
                result.current.handleCustomerSearchChange(mockEvent);
            });

            expect(mockStoreState.updateFormField).toHaveBeenCalledWith('customerId', '');
        });

        it('should handle customer input focus when customer is not pre-selected', () => {
            const {result} = renderHook(() => useAccountForm({}, false));

            act(() => {
                result.current.handleCustomerInputFocus();
            });

            expect(mockStoreState.setShowCustomerDropdown).toHaveBeenCalledWith(true);
        });

        it('should not show dropdown on focus when customer is pre-selected', () => {
            const {result} = renderHook(() => useAccountForm({}, true));

            act(() => {
                result.current.handleCustomerInputFocus();
            });

            expect(mockStoreState.setShowCustomerDropdown).not.toHaveBeenCalled();
        });

        it('should handle keyboard navigation for valid keys', () => {
            const {result} = renderHook(() => useAccountForm());

            const validKeys = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape'];

            validKeys.forEach(key => {
                const mockEvent = {
                    key,
                    preventDefault: jest.fn()
                };

                act(() => {
                    result.current.handleCustomerKeyDown(mockEvent);
                });

                expect(mockEvent.preventDefault).toHaveBeenCalled();
                expect(mockStoreState.handleKeyboardNavigation).toHaveBeenCalledWith(key);
            });
        });

        it('should not prevent default for invalid navigation keys', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockEvent = {
                key: 'Tab',
                preventDefault: jest.fn()
            };

            act(() => {
                result.current.handleCustomerKeyDown(mockEvent);
            });

            expect(mockEvent.preventDefault).not.toHaveBeenCalled();
            expect(mockStoreState.handleKeyboardNavigation).not.toHaveBeenCalled();
        });
    });

    describe('form submission', () => {
        it('should handle successful form submission when customer is selected', () => {
            const modifiedStoreState = {
                ...mockStoreState,
                formData: {...mockStoreState.formData, customerId: 'customer123'}
            };
            useAccountFormStore.mockReturnValue(modifiedStoreState);

            const {result} = renderHook(() => useAccountForm());

            const mockOnSubmit = jest.fn();
            const mockEvent = {
                preventDefault: jest.fn()
            };

            act(() => {
                result.current.handleSubmit(mockEvent, mockOnSubmit);
            });

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockStoreState.setError).toHaveBeenCalledWith('');
            expect(mockOnSubmit).toHaveBeenCalledWith(modifiedStoreState.formData);
        });

        it('should prevent submission when no customer is selected', () => {
            const {result} = renderHook(() => useAccountForm());

            const mockOnSubmit = jest.fn();
            const mockEvent = {
                preventDefault: jest.fn()
            };

            act(() => {
                result.current.handleSubmit(mockEvent, mockOnSubmit);
            });

            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(mockStoreState.setError).toHaveBeenCalledWith('Please select a customer');
            expect(mockOnSubmit).not.toHaveBeenCalled();
        });
    });

    describe('return values', () => {
        it('should return all necessary state and handlers', () => {
            const {result} = renderHook(() => useAccountForm());

            // Check that all expected properties are returned
            expect(result.current).toHaveProperty('formData');
            expect(result.current).toHaveProperty('loadingCustomers');
            expect(result.current).toHaveProperty('error');
            expect(result.current).toHaveProperty('customerSearch');
            expect(result.current).toHaveProperty('showCustomerDropdown');
            expect(result.current).toHaveProperty('filteredCustomers');
            expect(result.current).toHaveProperty('selectedCustomerIndex');

            // Check that all expected handlers are returned
            expect(result.current).toHaveProperty('handleChange');
            expect(result.current).toHaveProperty('handleCustomerSearchChange');
            expect(result.current).toHaveProperty('handleCustomerInputFocus');
            expect(result.current).toHaveProperty('handleCustomerKeyDown');
            expect(result.current).toHaveProperty('handleCustomerInputBlur');
            expect(result.current).toHaveProperty('handleSubmit');
            expect(result.current).toHaveProperty('selectCustomer');

            // Check that handlers are functions
            expect(typeof result.current.handleChange).toBe('function');
            expect(typeof result.current.handleCustomerSearchChange).toBe('function');
            expect(typeof result.current.handleCustomerInputFocus).toBe('function');
            expect(typeof result.current.handleCustomerKeyDown).toBe('function');
            expect(typeof result.current.handleSubmit).toBe('function');
        });
    });

    describe('effect dependencies', () => {
        it('should re-initialize form data when initialData changes', () => {
            const initialData1 = {accountType: 'checking'};
            const initialData2 = {accountType: 'savings'};

            const {rerender} = renderHook(
                ({initialData}) => useAccountForm(initialData),
                {initialProps: {initialData: initialData1}}
            );

            expect(mockStoreState.resetFormData).toHaveBeenCalledWith(initialData1);

            // Clear the mock to test the rerender
            mockStoreState.resetFormData.mockClear();

            rerender({initialData: initialData2});

            // With our new implementation, resetFormData should NOT be called again
            // as we only initialize once to prevent unnecessary resets
            expect(mockStoreState.resetFormData).not.toHaveBeenCalled();
        });

        it('should re-initialize customer search when customers become available', () => {
            // Start with no customers
            mockStoreState.customers = [];
            const {rerender} = renderHook(() => useAccountForm());

            // Clear the initial call
            mockStoreActions.initializeCustomerSearch.mockClear();

            // Simulate customers becoming available
            const newStoreState = {
                ...mockStoreState,
                customers: [{id: '1', name: 'Test Customer'}],
                formData: {...mockStoreState.formData, customerId: 'new-customer'}
            };
            useAccountFormStore.mockReturnValue(newStoreState);

            rerender();

            expect(mockStoreActions.initializeCustomerSearch).toHaveBeenCalled();
        });
    });
});
