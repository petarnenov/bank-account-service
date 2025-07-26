-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(20) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit')),
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'frozen')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);

-- Insert sample data
INSERT INTO customers (first_name, last_name, email, phone, address, date_of_birth) VALUES
('John', 'Doe', 'john.doe@email.com', '+1234567890', '123 Main St, City, State', '1990-01-15'),
('Jane', 'Smith', 'jane.smith@email.com', '+1234567891', '456 Oak Ave, City, State', '1985-03-22')
ON CONFLICT (email) DO NOTHING;

INSERT INTO accounts (account_number, account_type, balance, currency, customer_id) VALUES
('ACC001001', 'checking', 5000.00, 'USD', 1),
('ACC001002', 'savings', 15000.00, 'USD', 1),
('ACC002001', 'checking', 3500.00, 'USD', 2)
ON CONFLICT (account_number) DO NOTHING;