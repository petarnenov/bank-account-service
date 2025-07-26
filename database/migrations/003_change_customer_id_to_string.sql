-- Migration: Change customer ID to unique 20-character string
-- This migration will:
-- 1. Create a new temporary column for the new customer ID format
-- 2. Generate unique 20-character IDs for existing customers
-- 3. Update the accounts table to reference the new customer ID format
-- 4. Drop the old integer ID column and rename the new one

-- Step 1: Add new customer_id_new column
ALTER TABLE customers ADD COLUMN customer_id_new VARCHAR(20) UNIQUE;

-- Step 2: Generate unique 20-character IDs for existing customers
-- Using a combination of timestamp and random characters
UPDATE customers 
SET customer_id_new = UPPER(
    SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8) ||
    SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 12)
);

-- Step 3: Add new customer_id_new column to accounts table
ALTER TABLE accounts ADD COLUMN customer_id_new VARCHAR(20);

-- Step 4: Update accounts to use new customer IDs
UPDATE accounts 
SET customer_id_new = customers.customer_id_new 
FROM customers 
WHERE accounts.customer_id = customers.id;

-- Step 5: Drop foreign key constraint and old columns
ALTER TABLE accounts DROP CONSTRAINT accounts_customer_id_fkey;
ALTER TABLE accounts DROP COLUMN customer_id;
ALTER TABLE customers DROP COLUMN id;

-- Step 6: Rename new columns and add constraints
ALTER TABLE customers RENAME COLUMN customer_id_new TO id;
ALTER TABLE accounts RENAME COLUMN customer_id_new TO customer_id;

-- Step 7: Add primary key and foreign key constraints
ALTER TABLE customers ADD PRIMARY KEY (id);
ALTER TABLE accounts ADD CONSTRAINT accounts_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Step 8: Update indexes
DROP INDEX IF EXISTS idx_accounts_customer_id;
CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);

-- Step 9: Make customer_id NOT NULL
ALTER TABLE accounts ALTER COLUMN customer_id SET NOT NULL;
