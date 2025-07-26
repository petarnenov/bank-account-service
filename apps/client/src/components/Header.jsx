import React from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';

const Header = () => {
    const {user, logout, isAuthenticated} = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-left">
                    <h1>
                        <Link to="/" className="app-title">
                            Bank Account Service
                        </Link>
                    </h1>
                </div>

                <nav className="header-nav">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="nav-link">Dashboard</Link>
                            <Link to="/customers" className="nav-link">Customers</Link>
                            <Link to="/create-account" className="nav-link">Create Account</Link>

                            <div className="user-menu">
                                <span className="user-greeting">
                                    Welcome, {user?.firstName || user?.username}!
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="logout-button"
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="auth-links">
                            <Link to="/login" className="nav-link">Login</Link>
                            <Link to="/register" className="nav-link register-link">Register</Link>
                        </div>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;
