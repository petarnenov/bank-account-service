import React, {useEffect} from 'react';
import CustomerService from '../services/customerService';
import useAccountFormStore from '../store/useAccountFormStore';

const AccountForm = ({onSubmit, initialData = {}, isCustomerPreSelected = false}) => {
    // Split store access to avoid recreating dependencies
    const formData = useAccountFormStore(state => state.formData);
    const customers = useAccountFormStore(state => state.customers);
    const filteredCustomers = useAccountFormStore(state => state.filteredCustomers);
    const loadingCustomers = useAccountFormStore(state => state.loadingCustomers);
    const error = useAccountFormStore(state => state.error);
    const customerSearch = useAccountFormStore(state => state.customerSearch);
    const showCustomerDropdown = useAccountFormStore(state => state.showCustomerDropdown);
    const selectedCustomerIndex = useAccountFormStore(state => state.selectedCustomerIndex);

    // Actions - these are stable references in Zustand
    const updateFormField = useAccountFormStore(state => state.updateFormField);
    const setError = useAccountFormStore(state => state.setError);
    const setCustomerSearch = useAccountFormStore(state => state.setCustomerSearch);
    const setShowCustomerDropdown = useAccountFormStore(state => state.setShowCustomerDropdown);
    const selectCustomer = useAccountFormStore(state => state.selectCustomer);
    const handleKeyboardNavigation = useAccountFormStore(state => state.handleKeyboardNavigation);
    const handleCustomerInputBlur = useAccountFormStore(state => state.handleCustomerInputBlur);

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

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate that a customer is selected
        if (!formData.customerId) {
            setError('Please select a customer');
            return;
        }

        setError(''); // Clear any previous errors
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="account-form">
            <div className="form-group">
                <label htmlFor="accountType">Account Type:</label>
                <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    required
                >
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="credit">Credit</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="balance">Initial Balance:</label>
                <input
                    type="number"
                    id="balance"
                    name="balance"
                    value={formData.balance}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                />
            </div>

            <div className="form-group">
                <label htmlFor="currency">Currency:</label>
                <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="status">Account Status:</label>
                <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="frozen">Frozen</option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="customerId">
                    Customer:
                    {isCustomerPreSelected && (
                        <span className="pre-selected-badge">Pre-selected</span>
                    )}
                </label>
                {loadingCustomers ? (
                    <div className="loading-text">Loading customers...</div>
                ) : error ? (
                    <div className="error-text">{error}</div>
                ) : (
                    <div className="customer-search-container">
                        <input
                            type="text"
                            id="customerSearch"
                            value={customerSearch}
                            onChange={handleCustomerSearchChange}
                            onFocus={handleCustomerInputFocus}
                            onBlur={handleCustomerInputBlur}
                            onKeyDown={handleCustomerKeyDown}
                            placeholder={isCustomerPreSelected ? "Customer pre-selected" : "Search customers by name or email..."}
                            className={`customer-search-input ${isCustomerPreSelected ? 'disabled' : ''}`}
                            autoComplete="off"
                            disabled={isCustomerPreSelected}
                            readOnly={isCustomerPreSelected}
                        />
                        {!isCustomerPreSelected && showCustomerDropdown && filteredCustomers.length > 0 && (
                            <div className="customer-dropdown">
                                {filteredCustomers.map((customer, index) => (
                                    <div
                                        key={customer.id}
                                        className={`customer-option ${index === selectedCustomerIndex ? 'selected' : ''}`}
                                        onClick={() => selectCustomer(customer)}
                                    >
                                        <div className="customer-name">
                                            {customer.firstName} {customer.lastName}
                                        </div>
                                        <div className="customer-email">
                                            {customer.email}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!isCustomerPreSelected && showCustomerDropdown && filteredCustomers.length === 0 && customerSearch && (
                            <div className="customer-dropdown">
                                <div className="no-results">
                                    No customers found matching "{customerSearch}"
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button type="submit" className="submit-btn">
                Create Account
            </button>
        </form>
    );
};

export default AccountForm;