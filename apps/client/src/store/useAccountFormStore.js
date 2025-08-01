import {create} from 'zustand';

// Helper function to safely filter customers without causing infinite loops
const filterCustomers = (customers, searchTerm) => {
    if (!Array.isArray(customers)) return [];
    if (!searchTerm || searchTerm.trim() === '') return customers;

    const search = searchTerm.toLowerCase().trim();
    return customers.filter(customer => {
        if (!customer) return false;

        const firstName = (customer.firstName || '').toLowerCase();
        const lastName = (customer.lastName || '').toLowerCase();
        const email = (customer.email || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();

        return firstName.includes(search) ||
            lastName.includes(search) ||
            email.includes(search) ||
            fullName.includes(search);
    });
};

const useAccountFormStore = create((set, get) => ({
    // Form data state
    formData: {
        accountType: 'checking',
        balance: 0,
        currency: 'USD',
        customerId: '',
        status: 'active'
    },

    // Customer-related state
    customers: [],
    filteredCustomers: [],
    loadingCustomers: true,
    error: '',

    // Customer search state
    customerSearch: '',
    showCustomerDropdown: false,
    selectedCustomerIndex: -1,

    // Actions for form data
    setFormData: (data) => set({formData: data}),
    updateFormField: (field, value) => set((state) => ({
        formData: {...state.formData, [field]: value}
    })),
    resetFormData: (initialData = {}) => set({
        formData: {
            accountType: initialData.accountType || 'checking',
            balance: parseFloat(initialData.balance) || 0,
            currency: initialData.currency || 'USD',
            customerId: initialData.customerId || '',
            status: initialData.status || 'active'
        }
    }),

    // Actions for customers
    setCustomers: (customers) => {
        const safeCustomers = Array.isArray(customers) ? customers : [];
        const {customerSearch} = get();
        const filtered = filterCustomers(safeCustomers, customerSearch);

        set({
            customers: safeCustomers,
            loadingCustomers: false,
            filteredCustomers: filtered
        });
    },
    setLoadingCustomers: (loading) => set({loadingCustomers: loading}),
    setError: (error) => set({error}),

    // Actions for customer search
    setCustomerSearch: (search) => {
        const {customers} = get();
        const filtered = filterCustomers(customers, search);

        set({
            customerSearch: search,
            filteredCustomers: filtered
        });
    },
    setShowCustomerDropdown: (show) => set({showCustomerDropdown: show}),
    setSelectedCustomerIndex: (index) => set({selectedCustomerIndex: index}),

    // Filter customers based on search input (legacy method for backward compatibility)
    filterCustomers: () => {
        const {customers, customerSearch} = get();
        const filtered = filterCustomers(customers, customerSearch);
        set({filteredCustomers: filtered});
    },

    // Handle customer selection
    selectCustomer: (customer) => {
        if (!customer || !customer.id) return;

        const displayName = customer.firstName && customer.lastName
            ? `${customer.firstName} ${customer.lastName}${customer.email ? ` (${customer.email})` : ''}`
            : customer.email || customer.id;

        set((state) => ({
            formData: {...state.formData, customerId: customer.id},
            customerSearch: displayName,
            showCustomerDropdown: false,
            selectedCustomerIndex: -1
        }));
    },

    // Initialize customer search field if there's initial customer data
    initializeCustomerSearch: () => {
        const {formData, customers, customerSearch} = get();
        if (formData.customerId && Array.isArray(customers) && customers.length > 0 && !customerSearch) {
            const selectedCustomer = customers.find(c => c && c.id === formData.customerId);
            if (selectedCustomer) {
                const displayName = selectedCustomer.firstName && selectedCustomer.lastName
                    ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}${selectedCustomer.email ? ` (${selectedCustomer.email})` : ''}`
                    : selectedCustomer.email || selectedCustomer.id;

                set({customerSearch: displayName});
            } else {
                // If preselected customerId is not found, clear the field for typeahead
                set((state) => ({
                    formData: {...state.formData, customerId: ''},
                    customerSearch: ''
                }));
            }
        }
    },

    // Handle keyboard navigation
    handleKeyboardNavigation: (key) => {
        const {showCustomerDropdown, filteredCustomers, selectedCustomerIndex} = get();

        if (!showCustomerDropdown || !Array.isArray(filteredCustomers) || filteredCustomers.length === 0) return;

        switch (key) {
            case 'ArrowDown':
                set({
                    selectedCustomerIndex: selectedCustomerIndex < filteredCustomers.length - 1
                        ? selectedCustomerIndex + 1
                        : 0
                });
                break;
            case 'ArrowUp':
                set({
                    selectedCustomerIndex: selectedCustomerIndex > 0
                        ? selectedCustomerIndex - 1
                        : filteredCustomers.length - 1
                });
                break;
            case 'Enter':
                if (selectedCustomerIndex >= 0 && selectedCustomerIndex < filteredCustomers.length) {
                    const selectedCustomer = filteredCustomers[selectedCustomerIndex];
                    if (selectedCustomer) {
                        get().selectCustomer(selectedCustomer);
                    }
                }
                break;
            case 'Escape':
                set({
                    showCustomerDropdown: false,
                    selectedCustomerIndex: -1
                });
                break;
            default:
                break;
        }
    },

    // Handle customer input blur
    handleCustomerInputBlur: () => {
        setTimeout(() => {
            const state = get();
            set({
                showCustomerDropdown: false,
                selectedCustomerIndex: -1,
                customerSearch: state.formData.customerId ? state.customerSearch : ''
            });
        }, 200);
    },

    // Reset all state
    reset: () => set({
        formData: {
            accountType: 'checking',
            balance: 0,
            currency: 'USD',
            customerId: '',
            status: 'active'
        },
        customers: [],
        filteredCustomers: [],
        loadingCustomers: true,
        error: '',
        customerSearch: '',
        showCustomerDropdown: false,
        selectedCustomerIndex: -1
    })
}));

export default useAccountFormStore;
