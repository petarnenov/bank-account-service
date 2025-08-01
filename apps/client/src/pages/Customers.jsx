import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';
import CustomerService from '../services/customerService';
import AccountService from '../services/accountService';
import Modal from '../components/Modal';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [customerAccounts, setCustomerAccounts] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingStatus, setEditingStatus] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    // Helper: handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        const term = e.target.value.toLowerCase();
        setFilteredCustomers(
            customers.filter(c =>
                c.firstName.toLowerCase().includes(term) ||
                c.lastName.toLowerCase().includes(term) ||
                c.email.toLowerCase().includes(term) ||
                (c.phone && c.phone.includes(term)) ||
                (c.id && c.id.toLowerCase().includes(term)) ||
                (c.address && c.address.toLowerCase().includes(term))
            )
        );
    };

    // Helper: clear search
    const clearSearch = () => {
        setSearchTerm('');
        setFilteredCustomers(customers);
    };

    // Helper: handle status filter change
    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
        if (e.target.value === 'all') {
            setFilteredCustomers(customers);
        } else {
            setFilteredCustomers(customers.filter(c => c.status === e.target.value));
        }
    };

    // Helper: clear all filters
    const clearAllFilters = () => {
        setSearchTerm('');
        setStatusFilter('all');
        setFilteredCustomers(customers);
    };

    // Helper: get total balance for a customer
    const getTotalBalance = (customerId) => {
        const accounts = customerAccounts[customerId] || [];
        return accounts.reduce((sum, acc) => {
            const balance = parseFloat(acc.balance) || 0;
            return sum + balance;
        }, 0);
    };

    // Helper: get account summary for a customer
    const getAccountSummary = (customerId) => {
        const accounts = customerAccounts[customerId] || [];
        return {
            count: accounts.length,
            types: [...new Set(accounts.map(acc => acc.accountType && acc.accountType.toUpperCase()))].filter(Boolean),
        };
    };

    // Helper: calculate age from date of birth
    const calculateAge = (dob) => {
        if (!dob) return null;
        const birth = new Date(dob);
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    };

    // Helper: format currency
    const formatCurrency = (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency
        }).format(amount);
    };

    // Helper: format phone number
    const formatPhoneNumber = (phone) => {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    };

    // Handler: status change for customer
    const handleStatusChange = async (customerId, newStatus) => {
        const currentStatus = customers.find(c => c.id === customerId)?.status;
        if (newStatus === currentStatus) return;
        try {
            setEditingStatus(customerId);
            await CustomerService.updateCustomer(customerId, {status: newStatus});
            // Update status in local state
            setCustomers(prev => prev.map(c => c.id === customerId ? {...c, status: newStatus} : c));
            setFilteredCustomers(prev => prev.map(c => c.id === customerId ? {...c, status: newStatus} : c));
            setEditingStatus(null);
        } catch (err) {
            setModalMessage('Failed to update customer status. Please try again.');
            setModalOpen(true);
            setEditingStatus(null);
        }
    };

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
    if (loading) return <div className="loading">Loading customers...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <>
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
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Error"
                actions={<button onClick={() => setModalOpen(false)}>Close</button>}
            >
                {modalMessage}
            </Modal>
        </>
    );
};

export default Customers;
