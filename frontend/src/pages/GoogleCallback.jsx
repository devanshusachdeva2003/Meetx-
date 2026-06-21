import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import api from '../utils/api';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginContext } = useUser();
  const [errorMsg, setErrorMsg] = useState("");
  const hasCalled = useRef(false);

  useEffect(() => {
    if (hasCalled.current) return;
    
    const code = searchParams.get('code');
    if (code) {
      hasCalled.current = true;
      handleGoogleLogin(code);
    } else {
      setErrorMsg("Authorization code not found.");
      setTimeout(() => navigate('/login'), 3000);
    }
  }, []);

  const handleGoogleLogin = async (code) => {
    try {
      const response = await api.post("/auth/google/login", { code });
      const result = response.data;
      
      if (result.requireOtp) {
        localStorage.setItem("authEmail", result.email);
        navigate("/verify-otp");
      } else {
        loginContext(result.user, result.token);
        navigate("/");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Google login failed");
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden text-center">
        {errorMsg ? (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm">
            {errorMsg}
            <div className="mt-2 text-xs">Redirecting to login...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-semibold">Authenticating with Google...</h2>
            <p className="text-gray-400 mt-2">Please wait while we log you in.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
