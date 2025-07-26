import React from 'react';

const AccountCard = ({account, onClick}) => {
    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    return (
        <div className="account-card" onClick={() => onClick(account.id)}>
            <div className="account-header">
                <h3>{account.accountType.toUpperCase()}</h3>
                <span className={`status ${account.status}`}>{account.status}</span>
            </div>
            <div className="account-number">
                Account: {account.accountNumber}
            </div>
            <div className="account-balance">
                {formatCurrency(account.balance, account.currency)}
            </div>
        </div>
    );
};

export default AccountCard;