import React from 'react';
import {useAccountForm} from '../hooks/useAccountForm';

const AccountForm = ({onSubmit, initialData = {}, isCustomerPreSelected = false}) => {
    const {
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
    } = useAccountForm(initialData, isCustomerPreSelected);

    return (
        <form onSubmit={(e) => handleSubmit(e, onSubmit)} className="account-form">
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