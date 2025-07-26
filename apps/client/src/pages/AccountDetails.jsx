import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import AccountService from '../services/accountService';

const AccountDetails = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const data = await AccountService.getAccountById(id);
                setAccount(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [id]);

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    if (loading) return <div className="loading">Loading account details...</div>;
    if (error) return <div className="error">Error: {error}</div>;
    if (!account) return <div className="error">Account not found</div>;

    return (
        <div className="account-details">
            <button onClick={() => navigate(-1)} className="back-btn">
                ← Back
            </button>

            <div className="account-info">
                <h2>Account Details</h2>
                <div className="detail-row">
                    <label>Account Number:</label>
                    <span className="account-number">{account.accountNumber}</span>
                </div>
                <div className="detail-row">
                    <label>Account Type:</label>
                    <span>{account.accountType}</span>
                </div>
                <div className="detail-row">
                    <label>Balance:</label>
                    <span>{formatCurrency(account.balance, account.currency)}</span>
                </div>
                <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status ${account.status}`}>{account.status}</span>
                </div>
                <div className="detail-row">
                    <label>Customer ID:</label>
                    <span>{account.customerId}</span>
                </div>
                <div className="detail-row">
                    <label>Created:</label>
                    <span>{new Date(account.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

export default AccountDetails;