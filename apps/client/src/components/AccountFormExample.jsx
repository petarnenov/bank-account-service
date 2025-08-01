// Example usage of the AccountForm with Zustand store

import React from 'react';
import AccountForm from './AccountForm';
import useAccountFormStore from '../store/useAccountFormStore';

const AccountFormExample = () => {
    const {formData, reset} = useAccountFormStore((state) => ({
        formData: state.formData,
        reset: state.reset
    }));

    const handleSubmit = (data) => {
        console.log('Form submitted with data:', data);
        // Handle form submission here
        // For example, call API to create account

        // Reset form after successful submission
        reset();
    };

    const handleReset = () => {
        reset();
    };

    return (
        <div>
            <h2>Create New Account</h2>
            <AccountForm onSubmit={handleSubmit} />

            <div style={{marginTop: '20px', padding: '10px', border: '1px solid #ccc'}}>
                <h3>Current Form State (from Zustand store):</h3>
                <pre>{JSON.stringify(formData, null, 2)}</pre>
                <button onClick={handleReset}>Reset Form</button>
            </div>
        </div>
    );
};

export default AccountFormExample;
