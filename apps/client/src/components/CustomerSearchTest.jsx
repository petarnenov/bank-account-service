import React, {useEffect} from 'react';
import useAccountFormStore from '../store/useAccountFormStore';

const CustomerSearchTest = () => {
    const customerSearch = useAccountFormStore(state => state.customerSearch);
    const filteredCustomers = useAccountFormStore(state => state.filteredCustomers);
    const customers = useAccountFormStore(state => state.customers);
    const showCustomerDropdown = useAccountFormStore(state => state.showCustomerDropdown);
    const setCustomerSearch = useAccountFormStore(state => state.setCustomerSearch);
    const setShowCustomerDropdown = useAccountFormStore(state => state.setShowCustomerDropdown);

    // Mock some customers for testing
    useEffect(() => {
        const mockCustomers = [
            {id: '1', firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com'},
            {id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com'},
            {id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com'}
        ];
        useAccountFormStore.getState().setCustomers(mockCustomers);
    }, []);

    const handleSearchChange = (e) => {
        setCustomerSearch(e.target.value);
        setShowCustomerDropdown(true);
    };

    return (
        <div style={{padding: '20px', border: '1px solid #ccc', margin: '20px'}}>
            <h3>Customer Search Test</h3>
            <div>
                <label>Search Customers:</label>
                <input
                    type="text"
                    value={customerSearch}
                    onChange={handleSearchChange}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Type to search customers..."
                    style={{width: '300px', padding: '8px', margin: '10px 0'}}
                />
            </div>

            <div>
                <strong>Debug Info:</strong>
                <div>Total customers: {customers.length}</div>
                <div>Search term: "{customerSearch}"</div>
                <div>Filtered customers: {filteredCustomers.length}</div>
                <div>Show dropdown: {showCustomerDropdown ? 'Yes' : 'No'}</div>
            </div>

            {showCustomerDropdown && (
                <div style={{border: '1px solid #ddd', marginTop: '5px', backgroundColor: 'white'}}>
                    {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer, index) => (
                            <div
                                key={customer.id}
                                style={{
                                    padding: '8px',
                                    borderBottom: '1px solid #eee',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    setCustomerSearch(`${customer.firstName} ${customer.lastName} (${customer.email})`);
                                    setShowCustomerDropdown(false);
                                }}
                            >
                                <div><strong>{customer.firstName} {customer.lastName}</strong></div>
                                <div style={{fontSize: '0.9em', color: '#666'}}>{customer.email}</div>
                            </div>
                        ))
                    ) : customerSearch ? (
                        <div style={{padding: '8px', color: '#999'}}>
                            No customers found matching "{customerSearch}"
                        </div>
                    ) : (
                        <div style={{padding: '8px', color: '#999'}}>
                            All customers:
                            {customers.map(customer => (
                                <div key={customer.id} style={{padding: '4px 0'}}>
                                    {customer.firstName} {customer.lastName} ({customer.email})
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomerSearchTest;
