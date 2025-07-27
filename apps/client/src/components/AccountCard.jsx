import React, { useState } from 'react';
import AccountService from '../services/accountService';
import Modal from './Modal';


const AccountCard = ({ account, onClick }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const handleStatusChange = async (e) => {
        e.stopPropagation(); // Prevent card click
        const newStatus = e.target.value;

        if (newStatus === account.status) {
            return; // No change needed
        }

        setIsUpdating(true);
        try {
            await AccountService.updateAccountStatus(account.id, newStatus);
            // Reload the page to refresh all data
            window.location.reload();
        } catch (error) {
            console.error('Failed to update account status:', error);
            setModalMessage('Failed to update account status. Please try again.');
            setModalOpen(true);
            setIsUpdating(false);
        }
    };

    const handleCardClick = (e) => {
        // Only navigate if the click wasn't on the dropdown
        if (!e.target.closest('.status-dropdown')) {
            onClick(account.id);
        }
    };

    return (
        <>
            <div className="account-card" onClick={handleCardClick}>
                <div className="account-header">
                    <h3>{account.accountType.toUpperCase()}</h3>
                    <div className="status-dropdown" onClick={(e) => e.stopPropagation()}>
                        <select
                            value={account.status || 'active'}
                            onChange={handleStatusChange}
                            disabled={isUpdating}
                            className={`status-select ${account.status || 'active'}`}
                        >
                            <option value="active">ACTIVE</option>
                            <option value="inactive">INACTIVE</option>
                            <option value="frozen">FROZEN</option>
                        </select>
                    </div>
                </div>
                <div className="account-number">
                    Account: {account.accountNumber}
                </div>
                <div className="account-balance">
                    {formatCurrency(account.balance, account.currency)}
                </div>
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

export default AccountCard;