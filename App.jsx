import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';

import Login from './src/features/auth/components/Login';
import Signup from './src/features/auth/components/Signup';
import VerifyOtp from './src/features/auth/components/VerifyOtp';

import { AppProvider } from './src/shared/context/AppContext';
import { GameProvider } from './src/features/games/context/GameContext';
import { CallProvider } from './src/features/call/context/CallContext';

import DesktopLayout from './src/core/layout/DesktopLayout';
import MobileLayout from './src/core/layout/MobileLayout';
import TabletLayout from './src/core/layout/TabletLayout';
import ProtectedRoute from './src/core/router/ProtectedRoute';
import useResponsive from './src/shared/hooks/useResponsive';

// Layout Selector Component - Must be inside providers
const LayoutSelector = () => {
    const { isMobile, isTablet } = useResponsive();

    // Determine which layout to render based on screen size
    if (isMobile) {
        return <MobileLayout />;
    } else if (isTablet) {
        return <TabletLayout />;
    } else {
        return <DesktopLayout />;
    }
};

const App = () => {
    return (
        <AppProvider>
            <GameProvider>
                <CallProvider>
                    <HashRouter>
                        <Routes>
                            {/* Public Auth Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/verify-otp" element={<VerifyOtp />} />

                            {/* Protected Main Routes */}
                            <Route path="/*" element={
                                <ProtectedRoute>
                                    <LayoutSelector />
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </HashRouter>
                </CallProvider>
            </GameProvider>
        </AppProvider>
    );
};

export default App;

