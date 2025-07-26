import React from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import AccountForm from '../components/AccountForm';
import AccountService from '../services/accountService';

const CreateAccount = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const customerId = searchParams.get('customerId');

    const handleCreateAccount = async (accountData) => {
        try {
            await AccountService.createAccount(accountData);
            navigate('/');
        } catch (error) {
            alert('Failed to create account: ' + error.message);
        }
    };

    // Prepare initial data if customerId is provided
    const initialData = customerId ? {customerId} : {};

    return (
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
    );
};

export default CreateAccount;