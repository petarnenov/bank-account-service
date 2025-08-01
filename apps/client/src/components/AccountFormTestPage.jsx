import React from 'react';
import AccountForm from './AccountForm';
import CustomerSearchTest from './CustomerSearchTest';

const AccountFormTestPage = () => {
    const handleFormSubmit = (formData) => {
        console.log('Form submitted:', formData);
        alert('Form submitted! Check console for data.');
    };

    return (
        <div style={{padding: '20px'}}>
            <h1>Account Form Test Page</h1>

            {/* Test component to verify search functionality */}
            <CustomerSearchTest />

            <hr style={{margin: '40px 0'}} />

            {/* Actual form component */}
            <h2>Account Form</h2>
            <AccountForm onSubmit={handleFormSubmit} />
        </div>
    );
};

export default AccountFormTestPage;
