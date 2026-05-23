import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import Login from './pages/Login.jsx';

const Router = () => {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
};

export default Router;
