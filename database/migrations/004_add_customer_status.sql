-- Migration: Add status field to customers table
-- Add status column with default 'active' value
ALTER TABLE customers ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Create index for status for better query performance
CREATE INDEX idx_customers_status ON customers(status);

-- Update existing customers to have 'active' status
UPDATE customers SET status = 'active' WHERE status IS NULL;
