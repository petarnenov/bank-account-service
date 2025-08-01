import {useEffect} from 'react';
import CustomerService from '../services/customerService';
import useAccountFormStore from '../store/useAccountFormStore';

export const useAccountForm = (initialData = {}, isCustomerPreSelected = false) => {
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
        handleCustomerInputBlur
    } = useAccountFormStore();

    // Initialize form data when component mounts or initialData changes
    useEffect(() => {
        useAccountFormStore.getState().resetFormData(initialData);
    }, [initialData]);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await CustomerService.getAllCustomers();
                console.log('Fetched customers:', data); // Debug log
                useAccountFormStore.getState().setCustomers(data);
            } catch (err) {
                console.error('Error fetching customers:', err); // Debug log
                useAccountFormStore.getState().setError('Failed to load customers: ' + err.message);
                useAccountFormStore.getState().setLoadingCustomers(false);
            }
        };

        fetchCustomers();
    }, []);

    // Initialize customer search field if there's initial customer data
    useEffect(() => {
        useAccountFormStore.getState().initializeCustomerSearch();
    }, [formData.customerId, customers.length, customerSearch]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        // Convert numeric fields to numbers
        let processedValue = value;
        if (name === 'balance') {
            processedValue = value === '' ? 0 : parseFloat(value) || 0;
        }
        updateFormField(name, processedValue);
    };

    const handleCustomerSearchChange = (e) => {
        console.log('Customer search changed:', e.target.value); // Debug log
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
