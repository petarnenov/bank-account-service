import React, {useState, useEffect} from 'react';
import CustomerService from '../services/customerService';

const AccountForm = ({onSubmit, initialData = {}, isCustomerPreSelected = false}) => {
    const [formData, setFormData] = useState({
        accountType: initialData.accountType || 'checking',
        balance: initialData.balance || 0,
        currency: initialData.currency || 'USD',
        customerId: initialData.customerId || '',
        status: initialData.status || 'active'
    });

    const [customers, setCustomers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [error, setError] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);

    useEffect(() => {
        const fetchActiveCustomers = async () => {
            try {
                const data = await CustomerService.getActiveCustomers();
                setCustomers(data);
            } catch (err) {
                setError('Failed to load customers: ' + err.message);
            } finally {
                setLoadingCustomers(false);
            }
        };

        fetchActiveCustomers();
    }, []);

    // Filter customers based on search input
    useEffect(() => {
        if (!customerSearch) {
            setFilteredCustomers(customers);
        } else {
            const filtered = customers.filter(customer => {
                const searchTerm = customerSearch.toLowerCase();
                return (
                    customer.firstName.toLowerCase().includes(searchTerm) ||
                    customer.lastName.toLowerCase().includes(searchTerm) ||
                    customer.email.toLowerCase().includes(searchTerm) ||
                    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm)
                );
            });
            setFilteredCustomers(filtered);
        }
    }, [customers, customerSearch]);

    // Initialize customer search field if there's initial customer data
    useEffect(() => {
        if (formData.customerId && customers.length > 0 && !customerSearch) {
            const selectedCustomer = customers.find(c => c.id === formData.customerId);
            if (selectedCustomer) {
                setCustomerSearch(`${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.email})`);
            }
        }
    }, [formData.customerId, customers, customerSearch]);

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCustomerSearchChange = (e) => {
        setCustomerSearch(e.target.value);
        setShowCustomerDropdown(true);
        setSelectedCustomerIndex(-1);
    };

    const handleCustomerSelect = (customer) => {
        setFormData(prev => ({
            ...prev,
            customerId: customer.id
        }));
        setCustomerSearch(`${customer.firstName} ${customer.lastName} (${customer.email})`);
        setShowCustomerDropdown(false);
        setSelectedCustomerIndex(-1);
    };

    const handleCustomerInputFocus = () => {
        setShowCustomerDropdown(true);
    };

    const handleCustomerInputBlur = () => {
        // Delay hiding the dropdown to allow for clicks
        setTimeout(() => {
            setShowCustomerDropdown(false);
            setSelectedCustomerIndex(-1);

            // If no customer is selected, clear the search field
            if (!formData.customerId) {
                setCustomerSearch('');
            }
        }, 200);
    };

    const handleCustomerKeyDown = (e) => {
        if (!showCustomerDropdown || filteredCustomers.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedCustomerIndex(prev =>
                    prev < filteredCustomers.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedCustomerIndex(prev =>
                    prev > 0 ? prev - 1 : filteredCustomers.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedCustomerIndex >= 0) {
                    handleCustomerSelect(filteredCustomers[selectedCustomerIndex]);
                }
                break;
            case 'Escape':
                setShowCustomerDropdown(false);
                setSelectedCustomerIndex(-1);
                break;
            default:
                break;
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
                                        onClick={() => handleCustomerSelect(customer)}
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