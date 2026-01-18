-- Create Database
CREATE DATABASE IF NOT EXISTS fidelity_platform;
USE fidelity_platform;

-- Users Table (Standalone auth)
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    magic_link_token CHAR(64) UNIQUE,
    magic_link_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
);

-- Password Resets Table
CREATE TABLE password_resets (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token CHAR(64) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reset_token (token)
);

-- User Roles Table
CREATE TABLE user_roles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    UNIQUE (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profiles Table
CREATE TABLE profiles (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    country_of_residence VARCHAR(100),
    marital_status VARCHAR(50),
    tax_id VARCHAR(100),
    is_pep BOOLEAN DEFAULT FALSE,
    pep_details TEXT,
    kyc_status VARCHAR(50) DEFAULT 'pending',
    account_status ENUM('active', 'inactive', 'pending') DEFAULT 'pending',
    has_business BOOLEAN DEFAULT FALSE,
    business_name VARCHAR(255),
    business_type VARCHAR(100),
    business_industry VARCHAR(100),
    business_tax_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Wallets Table
CREATE TABLE wallets (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) UNIQUE NOT NULL,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Transactions Table
CREATE TABLE transactions (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    type ENUM('deposit', 'withdrawal', 'transfer', 'trade') NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'completed',
    reference_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_transaction_user (user_id),
    INDEX idx_transaction_status (status)
);

-- Deposits Table
CREATE TABLE deposits (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    crypto_type VARCHAR(50),
    transaction_hash VARCHAR(255),
    proof_notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by CHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_deposit_user (user_id),
    INDEX idx_deposit_status (status)
);

-- Withdrawals Table
CREATE TABLE withdrawals (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    withdrawal_method VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(255),
    bank_details TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by CHAR(36),
    reviewed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_withdrawal_user (user_id),
    INDEX idx_withdrawal_status (status)
);

-- Grant Applications Table
CREATE TABLE grant_applications (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    grant_type VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100),
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    project_description TEXT NOT NULL,
    requested_amount DECIMAL(15, 2) NOT NULL,
    status ENUM('pending', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_at DATETIME,
    reviewed_by CHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_grant_user (user_id),
    INDEX idx_grant_status (status)
);

-- Copy Trade Attempts Table
CREATE TABLE copy_trade_attempts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    trader_name VARCHAR(255) NOT NULL,
    asset_symbol VARCHAR(50) NOT NULL,
    asset_type ENUM('stock', 'crypto') NOT NULL,
    action_type ENUM('copy_trade', 'apply_strategy') NOT NULL,
    profit_percentage DECIMAL(5, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Logs Table
CREATE TABLE activity_logs (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details JSON,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- KYC Documents Table
CREATE TABLE kyc_documents (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    document_type ENUM('id', 'passport', 'drivers_license', 'utility_bill', 'bank_statement') NOT NULL,
    file_url TEXT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
