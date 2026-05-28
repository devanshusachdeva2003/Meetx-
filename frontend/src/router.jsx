import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './component/Dashboard.jsx';
import Login from './pages/Login.jsx';
import Meeting from './pages/Meeting.jsx';
import Calendar from './pages/Calendar.jsx';
import Settings from './pages/Settings.jsx';
import { Layout } from './component/Layout.jsx';

const Router = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={
          <div className="flex-1 min-w-0 px-8 py-10 flex flex-col gap-8 h-full items-center justify-center text-gray-400">
            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p>This page is currently under development.</p>
          </div>
        } />
      </Route>
      <Route path="/meeting/:id" element={<Meeting />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default Router;
