import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './component/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import OtpVerify from './pages/OtpVerify.jsx';
import Meeting from './pages/Meeting.jsx';
import Calendar from './pages/Calendar.jsx';
import Settings from './pages/Settings.jsx';
import { Layout } from './component/Layout.jsx';
import { useUser } from './context/UserContext.jsx';

import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();
  const token = localStorage.getItem('token');

  // If there's no token at all in localStorage, we can instantly redirect, 
  // but we'll show a quick redirect UI as requested.
  if (!token || (!loading && !user)) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-gray-200">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium animate-pulse">Redirecting to Login...</p>
        {/* The Navigate component will trigger the actual route change immediately */}
        <Navigate to="/login" replace />
      </div>
    );
  }

  // Show a nice loader while we wait for the auth/me API call to finish
  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-gray-200">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Starting Workspace</h2>
        <p className="text-sm text-gray-400">Authenticating your session...</p>
      </div>
    );
  }

  return children;
};

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="*" element={
          <div className="flex-1 min-w-0 px-8 py-10 flex flex-col gap-8 h-full items-center justify-center text-gray-400">
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p>This page is currently under development.</p>
          </div>
        } />
      </Route>
      <Route path="/meeting/:id" element={<Meeting />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<OtpVerify />} />
    </Routes>
  );
};

export default Router;
