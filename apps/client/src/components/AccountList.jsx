import React from 'react';
import AccountCard from './AccountCard';
import {useNavigate} from 'react-router-dom';

const AccountList = ({accounts}) => {
    const navigate = useNavigate();

    const handleAccountClick = (accountId) => {
        navigate(`/account/${accountId}`);
    };

    if (!accounts || accounts.length === 0) {
        return <div className="no-accounts">No accounts found</div>;
    }

    return (
        <div className="account-list">
            {accounts.map(account => (
                <AccountCard
                    key={account.id}
                    account={account}
                    onClick={handleAccountClick}
                />
            ))}
        </div>
    );
};

export default AccountList;