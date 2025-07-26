-- Alternative migration: Recreate customers table with string IDs
-- This approach creates a new table and migrates data

-- Step 1: Create new customers table with string ID
CREATE TABLE customers_new (
    id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create function to generate customer IDs
CREATE OR REPLACE FUNCTION generate_customer_id() RETURNS VARCHAR(20) AS $$
DECLARE
    timestamp_part VARCHAR(8);
    random_part VARCHAR(12);
    customer_id VARCHAR(20);
BEGIN
    -- Get last 8 digits of current timestamp
    timestamp_part := RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 8);
    
    -- Generate 12 random alphanumeric characters
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 12));
    
    -- Combine to make 20 character ID
    customer_id := timestamp_part || random_part;
    
    RETURN customer_id;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Insert existing customers with new string IDs
INSERT INTO customers_new (id, first_name, last_name, email, phone, address, date_of_birth, created_at, updated_at)
SELECT 
    generate_customer_id(),
    first_name, 
    last_name, 
    email, 
    phone, 
    address, 
    date_of_birth, 
    created_at, 
    updated_at 
FROM customers;

-- Step 4: Create mapping table for old to new IDs
CREATE TEMPORARY TABLE customer_id_mapping AS
SELECT 
    c_old.id as old_id,
    c_new.id as new_id
FROM customers c_old
JOIN customers_new c_new ON c_old.email = c_new.email;

-- Step 5: Update accounts table with new customer IDs
ALTER TABLE accounts ADD COLUMN customer_id_new VARCHAR(20);

UPDATE accounts 
SET customer_id_new = customer_id_mapping.new_id
FROM customer_id_mapping 
WHERE accounts.customer_id = customer_id_mapping.old_id;

-- Step 6: Drop foreign key constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_customer_id_fkey;

-- Step 7: Drop old customer_id column and rename new one
ALTER TABLE accounts DROP COLUMN customer_id;
ALTER TABLE accounts RENAME COLUMN customer_id_new TO customer_id;

-- Step 8: Make customer_id NOT NULL
ALTER TABLE accounts ALTER COLUMN customer_id SET NOT NULL;

-- Step 9: Drop old customers table and rename new one
DROP TABLE customers;
ALTER TABLE customers_new RENAME TO customers;

-- Step 10: Add foreign key constraint
ALTER TABLE accounts ADD CONSTRAINT accounts_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Step 11: Recreate indexes
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);

-- Step 12: Drop the function as it's no longer needed
DROP FUNCTION generate_customer_id();
