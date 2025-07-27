import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import Header from './Header';
import AiAssistant from './AiAssistant';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import AccountDetails from '../pages/AccountDetails';
import CreateAccount from '../pages/CreateAccount';
import Customers from '../pages/Customers';
import CreateCustomer from '../pages/CreateCustomer';


function AppContent() {
    const [aiCollapsed, setAiCollapsed] = useState(true);
    const { currentUser } = useAuth();
    return (
        <Router>
            <div className="App">
                <Header />
                <main className="main-content">
                    <Routes>
                        {/* Public routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Protected routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute>
                                    <Navigate to="/dashboard" replace />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/account/:id"
                            element={
                                <ProtectedRoute>
                                    <AccountDetails />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/create-account"
                            element={
                                <ProtectedRoute>
                                    <CreateAccount />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/customers"
                            element={
                                <ProtectedRoute>
                                    <Customers />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/create-customer"
                            element={
                                <ProtectedRoute>
                                    <CreateCustomer />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
                {currentUser && (
                    <AiAssistant collapsed={aiCollapsed} setCollapsed={setAiCollapsed} />
                )}
            </div>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
