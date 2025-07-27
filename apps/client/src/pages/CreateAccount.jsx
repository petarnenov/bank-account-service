import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AccountForm from '../components/AccountForm';
import AccountService from '../services/accountService';
import Modal from '../components/Modal';

const CreateAccount = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('customerId');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const handleCreateAccount = async (accountData) => {
        try {
            await AccountService.createAccount(accountData);
            navigate('/');
        } catch (error) {
            setModalMessage('Failed to create account: ' + error.message);
            setModalOpen(true);
        }
    };

    // Prepare initial data if customerId is provided
    const initialData = customerId ? { customerId } : {};

    return (
        <>
            <div className="create-account">
                <button onClick={() => navigate(-1)} className="back-btn">
                    ← Back
                </button>

                <h2>Create New Account</h2>
                <AccountForm
                    onSubmit={handleCreateAccount}
                    initialData={initialData}
                    isCustomerPreSelected={!!customerId}
                />
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

export default CreateAccount;