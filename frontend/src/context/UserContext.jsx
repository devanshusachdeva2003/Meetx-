import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        console.error('Failed to fetch user', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const loginContext = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
  };

  const logoutContext = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('authEmail'); // Clear stored email for OTP
  };

  return (
    <UserContext.Provider value={{ user, loading, loginContext, logoutContext }}>
      {children}
    </UserContext.Provider>
  );
};
