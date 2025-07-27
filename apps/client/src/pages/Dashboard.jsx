import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AccountList from '../components/AccountList';
import { useAuth } from '../contexts/AuthContext';
import AiAssistant from '../components/AiAssistant';

import AccountService from '../services/accountService';


const Dashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const [aiCollapsed, setAiCollapsed] = useState(true);
    const [accounts, setAccounts] = useState([]);
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await AccountService.getAllAccounts();
                setAccounts(data);
                setFilteredAccounts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    // Filter accounts based on status
    useEffect(() => {
        if (statusFilter === 'all') {
            setFilteredAccounts(accounts);
        } else {
            setFilteredAccounts(accounts.filter(account => account.status === statusFilter));
        }
    }, [accounts, statusFilter]);

    console.log("push111 statusFilter", statusFilter)

    // Calculate status statistics
    const getStatusStats = () => {
        const stats = {
            total: accounts.length,
            active: accounts.filter(acc => acc.status === 'active').length,
            inactive: accounts.filter(acc => acc.status === 'inactive').length,
            frozen: accounts.filter(acc => acc.status === 'frozen').length
        };

        // Calculate total balance by status
        const balanceByStatus = {
            total: accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
            active: accounts.filter(acc => acc.status === 'active').reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
            inactive: accounts.filter(acc => acc.status === 'inactive').reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0),
            frozen: accounts.filter(acc => acc.status === 'frozen').reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
        };

        return { ...stats, balances: balanceByStatus };
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (loading) return <div className="loading">Loading accounts...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    const stats = getStatusStats();

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Account Dashboard</h2>
                <Link to="/create-account" className="create-btn">
                    + Create Account
                </Link>
            </div>


            {/* Status Overview Cards */}
            <div className="dashboard-overview">
                <div className="overview-card total">
                    <div className="card-header">
                        <h3>Total Accounts</h3>
                        <span className="card-icon">📊</span>
                    </div>
                    <div className="card-value">{stats.total}</div>
                    <div className="card-balance">{formatCurrency(stats.balances.total)}</div>
                </div>

                <div className="overview-card active">
                    <div className="card-header">
                        <h3>Active Accounts</h3>
                        <span className="card-icon">✅</span>
                    </div>
                    <div className="card-value">{stats.active}</div>
                    <div className="card-balance">{formatCurrency(stats.balances.active)}</div>
                    <div className="card-percentage">
                        {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% of total
                    </div>
                </div>

                <div className="overview-card inactive">
                    <div className="card-header">
                        <h3>Inactive Accounts</h3>
                        <span className="card-icon">⚠️</span>
                    </div>
                    <div className="card-value">{stats.inactive}</div>
                    <div className="card-balance">{formatCurrency(stats.balances.inactive)}</div>
                    <div className="card-percentage">
                        {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% of total
                    </div>
                </div>

                <div className="overview-card frozen">
                    <div className="card-header">
                        <h3>Frozen Accounts</h3>
                        <span className="card-icon">🔒</span>
                    </div>
                    <div className="card-value">{stats.frozen}</div>
                    <div className="card-balance">{formatCurrency(stats.balances.frozen)}</div>
                    <div className="card-percentage">
                        {stats.total > 0 ? Math.round((stats.frozen / stats.total) * 100) : 0}% of total
                    </div>
                </div>
            </div>

            {/* Status Filter */}
            <div className="dashboard-filters">
                <label htmlFor="statusFilter">Filter by Status:</label>
                <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="status-filter-select"
                >
                    <option value="all">All Accounts ({stats.total})</option>
                    <option value="active">Active ({stats.active})</option>
                    <option value="inactive">Inactive ({stats.inactive})</option>
                    <option value="frozen">Frozen ({stats.frozen})</option>
                </select>
            </div>

            {/* Account List */}
            <AccountList accounts={filteredAccounts} />

            {/* AI Assistant (only show if logged in) */}
            {user && (
                <AiAssistant collapsed={aiCollapsed} setCollapsed={setAiCollapsed} />
            )}
        </div>
    );
};

export default Dashboard;