import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import Button from "../component/ui/Button";
import ControlledOTPInput from "../component/ui/ControlledOTPInput";
import { useUser } from "../context/UserContext";
import api from "../utils/api";

const OtpVerify = () => {
  const methods = useForm({
    defaultValues: {
      otp: ""
    }
  });
  const { formState: { isSubmitting } } = methods;
  const navigate = useNavigate();
  const { loginContext } = useUser();
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const storedEmail = localStorage.getItem('authEmail');
    if (!storedEmail) {
      navigate('/login');
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const onSubmit = async (data) => {
    if (!data.otp || data.otp.length !== 6) return;

    setErrorMsg("");
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: data.otp
      });

      const result = response.data;
      
      loginContext(result.user, result.token);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "OTP Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
        
        <div className="mb-8 text-center relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
          <p className="text-gray-400">
            We sent a verification code to <br/>
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <ControlledOTPInput 
              name="otp" 
              otpLength={6}
              gap="0.5rem"
            />

            <Button 
              disabled={isSubmitting} 
              type="submit" 
              className="gradient-primary text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(168,85,247,0.5)] w-full py-3 rounded-2xl border-0 mt-2"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </FormProvider>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
          Didn't receive the code?{" "}
          <button className="font-semibold text-primary hover:text-primary-glow transition-colors bg-transparent border-0">
            Resend
          </button>
        </p>
      </div>
    </div>
  );
};

export default OtpVerify;
