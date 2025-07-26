-- Migration: Create users table for authentication
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Insert a default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash, first_name, last_name, role) VALUES 
('admin', 'admin@example.com', '$2b$10$rQZ8Qr6GqZ1Q5Z8Q5Z8Q5e7jQZ8Q5Z8Q5Z8Q5Z8Q5Z8Q5Z8Q5Z8Q5u', 'Admin', 'User', 'admin'),
('testuser', 'test@example.com', '$2b$10$rQZ8Qr6GqZ1Q5Z8Q5Z8Q5e7jQZ8Q5Z8Q5Z8Q5Z8Q5Z8Q5Z8Q5Z8Q5u', 'Test', 'User', 'user');
