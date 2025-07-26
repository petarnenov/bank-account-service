import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CustomerService from '../services/customerService';

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const data = await CustomerService.getAllCustomers();
                setCustomers(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    if (loading) return <div className="loading">Loading customers...</div>;
    if (error) return <div className="error">Error: {error}</div>;

    return (
        <div className="customers-page">
            <div className="customers-header">
                <h2>Customers</h2>
                <Link to="/create-customer" className="create-btn">
                    Create New Customer
                </Link>
            </div>
            
            {customers.length === 0 ? (
                <div className="no-customers">
                    <p>No customers found. Create your first customer to get started.</p>
                    <Link to="/create-customer" className="create-btn">
                        Create Customer
                    </Link>
                </div>
            ) : (
                <div className="customers-grid">
                    {customers.map(customer => (
                        <div key={customer.id} className="customer-card">
                            <div className="customer-header">
                                <h3>{customer.firstName} {customer.lastName}</h3>
                                <span className="customer-id">ID: {customer.id}</span>
                            </div>
                            
                            <div className="customer-details">
                                <div className="detail-item">
                                    <strong>Email:</strong> {customer.email}
                                </div>
                                
                                {customer.phone && (
                                    <div className="detail-item">
                                        <strong>Phone:</strong> {customer.phone}
                                    </div>
                                )}
                                
                                {customer.address && (
                                    <div className="detail-item">
                                        <strong>Address:</strong> {customer.address}
                                    </div>
                                )}
                                
                                {customer.dateOfBirth && (
                                    <div className="detail-item">
                                        <strong>Date of Birth:</strong> {new Date(customer.dateOfBirth).toLocaleDateString()}
                                    </div>
                                )}
                                
                                <div className="detail-item">
                                    <strong>Created:</strong> {new Date(customer.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Customers;
