import React, {useState, useEffect} from 'react';
import AccountList from '../components/AccountList';
import AccountService from '../services/accountService';

const Dashboard = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const data = await AccountService.getAllAccounts();
                setAccounts(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    if (loading) return <div className="loading">Loading accounts...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h2>Account Dashboard</h2>
            </div>
            <AccountList accounts={accounts} />
        </div>
    );
};

export default Dashboard;