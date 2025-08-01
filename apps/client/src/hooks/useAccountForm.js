import {useEffect, useRef} from 'react';
import CustomerService from '../services/customerService';
import useAccountFormStore from '../store/useAccountFormStore';

export const useAccountForm = (initialData = {}, isCustomerPreSelected = false) => {
    // Use ref to track if we've initialized to prevent unnecessary resets
    const isInitialized = useRef(false);
    const initialDataRef = useRef(initialData);

    // Single store subscription for better performance
    const {
        formData,
        customers,
        filteredCustomers,
        loadingCustomers,
        error,
        customerSearch,
        showCustomerDropdown,
        selectedCustomerIndex,
        // Actions
        updateFormField,
        setError,
        setCustomerSearch,
        setShowCustomerDropdown,
        selectCustomer,
        handleKeyboardNavigation,
        handleCustomerInputBlur,
        resetFormData
    } = useAccountFormStore();

    // Initialize form data only once on mount with the initial data
    useEffect(() => {
        if (!isInitialized.current) {
            resetFormData(initialDataRef.current);
            isInitialized.current = true;
        }
    }, [resetFormData]); // Include resetFormData as dependency

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await CustomerService.getAllCustomers();
                // Ensure we always have an array, even if data is undefined/null
                const safeData = Array.isArray(data) ? data : [];
                useAccountFormStore.getState().setCustomers(safeData);
            } catch (err) {
                useAccountFormStore.getState().setError('Failed to load customers: ' + err.message);
                useAccountFormStore.getState().setCustomers([]); // Set empty array on error
                useAccountFormStore.getState().setLoadingCustomers(false);
            }
        };

        fetchCustomers();
    }, []);

    // Initialize customer search field if there's initial customer data
    useEffect(() => {
        if (customers.length > 0) {
            useAccountFormStore.getState().initializeCustomerSearch();
        }
    }, [formData.customerId, customers.length]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        // Convert numeric fields to numbers, but preserve empty strings
        let processedValue = value;
        if (name === 'balance') {
            // Only convert to number if there's actually a value
            if (value === '') {
                processedValue = ''; // Keep empty string for empty input
            } else {
                processedValue = parseFloat(value) || 0;
            }
        }
        updateFormField(name, processedValue);
    };

    const handleCustomerSearchChange = (e) => {
        setCustomerSearch(e.target.value);
        setShowCustomerDropdown(true);
        // Reset selected index and clear customer ID when typing
        useAccountFormStore.getState().setSelectedCustomerIndex(-1);
        if (e.target.value !== customerSearch) {
            updateFormField('customerId', '');
        }
    };

    const handleCustomerInputFocus = () => {
        if (!isCustomerPreSelected) {
            setShowCustomerDropdown(true);
        }
    };

    const handleCustomerKeyDown = (e) => {
        // Only prevent default for navigation keys
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
            e.preventDefault();
            handleKeyboardNavigation(e.key);
        }
    };

    const handleSubmit = (e, onSubmit) => {
        e.preventDefault();

        // Validate that a customer is selected
        if (!formData.customerId) {
            setError('Please select a customer');
            return;
        }

        setError(''); // Clear any previous errors
        onSubmit(formData);
    };

    // Return only what the JSX needs
    return {
        // State for rendering
        formData,
        customers,
        loadingCustomers,
        error,
        customerSearch,
        showCustomerDropdown,
        filteredCustomers,
        selectedCustomerIndex,

        // Event handlers
        handleChange,
        handleCustomerSearchChange,
        handleCustomerInputFocus,
        handleCustomerKeyDown,
        handleCustomerInputBlur,
        handleSubmit,
        selectCustomer
    };
};
