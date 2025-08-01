import {create} from 'zustand';

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
        set({customers, loadingCustomers: false});
        get().filterCustomers();
    },
    setLoadingCustomers: (loading) => set({loadingCustomers: loading}),
    setError: (error) => set({error}),

    // Actions for customer search
    setCustomerSearch: (search) => {
        set({customerSearch: search});
        get().filterCustomers();
    },
    setShowCustomerDropdown: (show) => set({showCustomerDropdown: show}),
    setSelectedCustomerIndex: (index) => set({selectedCustomerIndex: index}),

    // Filter customers based on search input
    filterCustomers: () => {
        const {customers, customerSearch} = get();
        if (!customerSearch) {
            set({filteredCustomers: customers});
        } else {
            const searchTerm = customerSearch.toLowerCase();
            const filtered = customers.filter(customer => {
                return (
                    customer.firstName.toLowerCase().includes(searchTerm) ||
                    customer.lastName.toLowerCase().includes(searchTerm) ||
                    customer.email.toLowerCase().includes(searchTerm) ||
                    `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm)
                );
            });
            set({filteredCustomers: filtered});
        }
    },

    // Handle customer selection
    selectCustomer: (customer) => {
        set((state) => ({
            formData: {...state.formData, customerId: customer.id},
            customerSearch: `${customer.firstName} ${customer.lastName} (${customer.email})`,
            showCustomerDropdown: false,
            selectedCustomerIndex: -1
        }));
    },

    // Initialize customer search field if there's initial customer data
    initializeCustomerSearch: () => {
        const {formData, customers, customerSearch} = get();
        if (formData.customerId && customers.length > 0 && !customerSearch) {
            const selectedCustomer = customers.find(c => c.id === formData.customerId);
            if (selectedCustomer) {
                set({
                    customerSearch: `${selectedCustomer.firstName} ${selectedCustomer.lastName} (${selectedCustomer.email})`
                });
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

        if (!showCustomerDropdown || filteredCustomers.length === 0) return;

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
                if (selectedCustomerIndex >= 0) {
                    get().selectCustomer(filteredCustomers[selectedCustomerIndex]);
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
            const {formData} = get();
            set({
                showCustomerDropdown: false,
                selectedCustomerIndex: -1,
                customerSearch: formData.customerId ? get().customerSearch : ''
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
