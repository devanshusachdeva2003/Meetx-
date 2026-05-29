import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import Button from "../component/ui/Button";
import ControlledOTPInput from "../component/ui/ControlledOTPInput";
import CountdownTimer from "../component/ui/CountdownTimer";
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
  const [successMsg, setSuccessMsg] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

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
    setSuccessMsg("");
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

  const handleResend = async () => {
    if (isResending) return;
    
    setIsResending(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      const response = await api.post('/auth/resend-otp', { email });
      setSuccessMsg(response.data.message || "OTP resent successfully");
      setShowResendButton(false);
      setTimerKey(prev => prev + 1);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to resend OTP");
    } finally {
      setIsResending(false);
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
        
        {successMsg && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center">
            {successMsg}
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
              size="lg"
              className="w-full mt-2"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </FormProvider>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10 flex items-center justify-center gap-1">
          Didn't receive the code?{" "}
          {!showResendButton ? (
            <CountdownTimer 
              key={timerKey}
              initialSeconds={60}
              setShowResendButton={setShowResendButton}
            />
          ) : (
            <Button 
              variant="none" 
              size="none" 
              onClick={handleResend}
              disabled={isResending}
              className="font-semibold text-primary hover:text-primary-glow transition-colors"
            >
              {isResending ? "Sending..." : "Resend"}
            </Button>
          )}
        </p>
      </div>
    </div>
  );
};

export default OtpVerify;
