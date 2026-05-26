import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Login from './pages/Login.jsx';
import Meeting from './pages/Meeting.jsx';
import Calendar from './pages/Calendar.jsx';
import MeetXSettingsMobile from './component/MeetXSettingsMobile.jsx';
import Settings from './pages/Settings.jsx';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
      <Route path="/meeting/:id" element={<Meeting />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/calendar" element={<Calendar />} />
    </Routes>
  );
};

export default Router;
