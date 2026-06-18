import React, { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import ControlledOTPInput from "../component/ui/ControlledOTPInput";
import ControlledPasswordField from "../component/ui/ControlledPasswordField";
import Button from "../component/ui/Button";
import api from "../utils/api";

const ResetPassword = () => {
  const methods = useForm({
    defaultValues: {
      email: localStorage.getItem("resetEmail") || "",
      otp: "",
      password: ""
    }
  });
  const {
    formState: { errors, isSubmitting },
    getValues
  } = methods;
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: null, text: "" });

  useEffect(() => {
    if (!getValues("email")) {
      navigate("/forgot-password");
    }
  }, [navigate, getValues]);

  const onSubmit = async (data) => {
    if (!data.otp || data.otp.length !== 6) {
      setStatus({ type: "error", text: "Please enter a valid 6-digit OTP" });
      return;
    }

    setStatus({ type: null, text: "" });
    try {
      await api.post("/auth/reset-password", {
        email: data.email,
        otp: data.otp,
        newPassword: data.password
      });

      setStatus({ type: "success", text: "Password reset successfully. Redirecting to login..." });
      localStorage.removeItem("resetEmail");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.error || "Failed to reset password" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden">
        <div className="mb-8 text-center relative z-10">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
            Reset Password
          </h1>
          <p className="text-gray-400 relative z-10">
            Enter the OTP sent to <br/>
            <span className="text-white font-medium">{getValues("email")}</span>
            <br /> and your new password.
          </p>
        </div>

        {status.text && (
          <div className={`mb-4 p-3 border rounded-xl text-sm text-center relative z-10 ${
            status.type === 'error' 
              ? 'bg-red-500/10 border-red-500/50 text-red-400' 
              : 'bg-green-500/10 border-green-500/50 text-green-400'
          }`}>
            {status.text}
          </div>
        )}

        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-6 relative z-10"
          >
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                OTP Verification Code
              </label>
              <ControlledOTPInput 
                name="otp" 
                otpLength={6}
                gap="0.5rem"
              />
            </div>

            <ControlledPasswordField
              field={{
                name: "password",
                placeholder: "Enter new password",
                validation: {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                },
              }}
              label="New Password"
              inputClassName={`!bg-input ${!errors.password ? "!border-border focus:!border-primary focus:!ring-primary/20" : ""}`}
            />

            <Button
              disabled={isSubmitting}
              type="submit"
              size="lg"
              className="w-full mt-6"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </FormProvider>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
          Remember your password?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary-glow transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
