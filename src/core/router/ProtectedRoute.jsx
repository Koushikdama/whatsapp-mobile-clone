/**
 * Protected Route Component
 * Updated to use Firebase authentication via AppContext
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../../shared/context/AppContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, authLoading } = useApp();
    
    // Show loading while checking auth state
    if (authLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-[#EFEAE2] dark:bg-[#111b21] gap-4">
                <div className="w-12 h-12 border-4 border-wa-teal border-t-transparent rounded-full animate-spin"></div>
                <div className="text-wa-teal dark:text-gray-300 font-medium animate-pulse">
                    Checking authentication...
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
