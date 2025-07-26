import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import CustomerService from '../services/customerService';
import AccountService from '../services/accountService';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [customerAccounts, setCustomerAccounts] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingStatus, setEditingStatus] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await CustomerService.getAllCustomers();
                setCustomers(data);
                setFilteredCustomers(data);

                // Fetch accounts for each customer
                const accountsData = {};
                await Promise.all(
                    data.map(async (customer) => {
                        try {
                            const accounts = await AccountService.getAccountsByCustomerId(customer.id);
                            accountsData[customer.id] = accounts;
                        } catch (error) {
                            // If no accounts found, set empty array
                            accountsData[customer.id] = [];
                        }
                    })
                );
                setCustomerAccounts(accountsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    // Filter customers based on search term and status filter
    useEffect(() => {
        let filtered = customers;

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(customer => customer.status === statusFilter);
        }

        // Apply search filter
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(customer => {
                return (
                    customer.firstName?.toLowerCase().includes(searchLower) ||
                    customer.lastName?.toLowerCase().includes(searchLower) ||
                    customer.email?.toLowerCase().includes(searchLower) ||
                    customer.phone?.toLowerCase().includes(searchLower) ||
                    customer.id?.toLowerCase().includes(searchLower) ||
                    customer.address?.toLowerCase().includes(searchLower)
                );
            });
        }

        setFilteredCustomers(filtered);
    }, [searchTerm, customers, statusFilter]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
    };

    // Helper function to calculate age
    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return null;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Helper function to calculate total balance
    const getTotalBalance = (customerId) => {
        const accounts = customerAccounts[customerId] || [];
        return accounts.reduce((total, account) => total + parseFloat(account.balance || 0), 0);
    };

    // Helper function to get account summary
    const getAccountSummary = (customerId) => {
        const accounts = customerAccounts[customerId] || [];
        if (accounts.length === 0) return {count: 0, types: []};

        const types = [...new Set(accounts.map(acc => acc.accountType))];
        return {count: accounts.length, types};
    };

    // Helper function to format currency
    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    // Helper function to format phone number
    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    };

    const handleStatusChange = async (customerId, newStatus) => {
        const currentStatus = customers.find(c => c.id === customerId)?.status;

        if (newStatus === currentStatus) {
            return; // No change needed
        }

        try {
            setEditingStatus(customerId);
            await CustomerService.updateCustomer(customerId, {status: newStatus});

            // Reload the page to refresh all data (consistent with account cards)
            window.location.reload();
        } catch (err) {
            console.error('Failed to update customer status:', err);
            alert('Failed to update customer status. Please try again.');
            setError(err.message);
            setEditingStatus(null);
        }
    };

    if (loading) return <div className="loading">Loading customers...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="customers-page">
            <div className="customers-header">
                <h2>Customers</h2>
                <Link to="/create-customer" className="create-btn">
                    Create New Customer
                </Link>
            </div>

            {/* Search Bar and Filters */}
            <div className="search-and-filters">
                <div className="search-container">
                    <div className="search-input-wrapper">
                        <input
                            type="text"
                            placeholder="Search customers by name, email, phone, ID, or address..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="clear-search-btn"
                                title="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>

                <div className="filter-container">
                    <div className="filter-group">
                        <label htmlFor="statusFilter" className="filter-label">Status:</label>
                        <select
                            id="statusFilter"
                            value={statusFilter}
                            onChange={handleStatusFilterChange}
                            className="filter-select"
                        >
                            <option value="all">All Customers</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>

                    {(searchTerm || statusFilter !== 'all') && (
                        <button
                            onClick={clearAllFilters}
                            className="clear-filters-btn"
                            title="Clear all filters"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {(searchTerm || statusFilter !== 'all') && (
                    <div className="search-results-info">
                        Found {filteredCustomers.length} of {customers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
                        {searchTerm && ` matching "${searchTerm}"`}
                        {statusFilter !== 'all' && ` (${statusFilter})`}
                    </div>
                )}
            </div>

            {filteredCustomers.length === 0 ? (
                <div className="no-customers">
                    {searchTerm || statusFilter !== 'all' ? (
                        <>
                            <p>No customers found matching your filters</p>
                            {searchTerm && <p>Search: "{searchTerm}"</p>}
                            {statusFilter !== 'all' && <p>Status: {statusFilter}</p>}
                            <button onClick={clearAllFilters} className="clear-filters-btn-large">
                                Clear All Filters
                            </button>
                        </>
                    ) : (
                        <>
                            <p>No customers found. Create your first customer to get started.</p>
                            <Link to="/create-customer" className="create-btn">
                                Create Customer
                            </Link>
                        </>
                    )}
                </div>
            ) : (
                <div className="customers-grid">
                    {filteredCustomers.map(customer => {
                        const totalBalance = getTotalBalance(customer.id);
                        const accountSummary = getAccountSummary(customer.id);
                        const age = calculateAge(customer.dateOfBirth);

                        return (
                            <div key={customer.id} className="customer-card">
                                <div className="customer-header">
                                    <div className="customer-name-section">
                                        <h3>{customer.firstName} {customer.lastName}</h3>
                                        {age && <span className="customer-age">Age: {age}</span>}
                                    </div>
                                    <span className="customer-id">ID: {customer.id}</span>
                                </div>

                                {/* Account Summary Section */}
                                <div className="account-summary">
                                    <div className="summary-header">
                                        <h4>Account Summary</h4>
                                        <span className="account-count">{accountSummary.count} Account{accountSummary.count !== 1 ? 's' : ''}</span>
                                    </div>
                                    {accountSummary.count > 0 ? (
                                        <div className="summary-details">
                                            <div className="total-balance">
                                                <strong>Total Balance: {formatCurrency(totalBalance)}</strong>
                                            </div>
                                            <div className="account-types">
                                                <span>Types: {accountSummary.types.join(', ')}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-accounts-notice">
                                            <span>No accounts found</span>
                                            <Link to="/create-account" className="create-account-link">Create Account</Link>
                                        </div>
                                    )}
                                </div>

                                <div className="customer-details">
                                    <div className="detail-item">
                                        <strong>Email:</strong>
                                        <a href={`mailto:${customer.email}`} className="email-link">{customer.email}</a>
                                    </div>

                                    <div className="detail-item">
                                        <strong>Status:</strong>
                                        {editingStatus === customer.id ? (
                                            <span className="loading-text">Updating...</span>
                                        ) : (
                                            <div className="status-dropdown" onClick={(e) => e.stopPropagation()}>
                                                <select
                                                    value={customer.status || 'active'}
                                                    onChange={(e) => handleStatusChange(customer.id, e.target.value)}
                                                    disabled={editingStatus === customer.id}
                                                    className={`status-select ${customer.status || 'active'}`}
                                                >
                                                    <option value="active">ACTIVE</option>
                                                    <option value="inactive">INACTIVE</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    {customer.phone && (
                                        <div className="detail-item">
                                            <strong>Phone:</strong>
                                            <a href={`tel:${customer.phone}`} className="phone-link">
                                                {formatPhoneNumber(customer.phone)}
                                            </a>
                                        </div>
                                    )}

                                    {customer.address && (
                                        <div className="detail-item">
                                            <strong>Address:</strong>
                                            <span className="address-text">{customer.address}</span>
                                        </div>
                                    )}

                                    {customer.dateOfBirth && (
                                        <div className="detail-item">
                                            <strong>Date of Birth:</strong>
                                            <span>{new Date(customer.dateOfBirth).toLocaleDateString()}</span>
                                        </div>
                                    )}

                                    <div className="detail-item">
                                        <strong>Member Since:</strong>
                                        <span>{new Date(customer.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {customer.updatedAt !== customer.createdAt && (
                                        <div className="detail-item">
                                            <strong>Last Updated:</strong>
                                            <span>{new Date(customer.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Actions */}
                                <div className="customer-actions">
                                    <Link to={`/create-account?customerId=${customer.id}`} className="action-btn primary">
                                        Create Account
                                    </Link>
                                    <button className="action-btn secondary" onClick={() => window.open(`mailto:${customer.email}`)}>
                                        Send Email
                                    </button>
                                    {customer.phone && (
                                        <button className="action-btn secondary" onClick={() => window.open(`tel:${customer.phone}`)}>
                                            Call
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Customers;
