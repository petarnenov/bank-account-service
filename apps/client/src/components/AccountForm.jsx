import React, {useState} from 'react';

const AccountForm = ({onSubmit, initialData = {}}) => {
    const [formData, setFormData] = useState({
        accountType: initialData.accountType || 'checking',
        balance: initialData.balance || 0,
        currency: initialData.currency || 'USD',
        customerId: initialData.customerId || ''
    });

    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
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
                <label htmlFor="customerId">Customer ID:</label>
                <input
                    type="number"
                    id="customerId"
                    name="customerId"
                    value={formData.customerId}
                    onChange={handleChange}
                    required
                />
            </div>

            <button type="submit" className="submit-btn">
                Create Account
            </button>
        </form>
    );
};

export default AccountForm;