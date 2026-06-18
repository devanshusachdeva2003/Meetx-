import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import ControlledTextField from "../component/ui/ControlledTextField";
import Button from "../component/ui/Button";
import api from "../utils/api";

const ForgotPassword = () => {
  const methods = useForm();
  const {
    formState: { errors, isSubmitting },
  } = methods;
  const navigate = useNavigate();
  const [status, setStatus] = useState({ type: null, text: "" });

  const onSubmit = async (data) => {
    setStatus({ type: null, text: "" });
    try {
      await api.post("/auth/forgot-password", {
        email: data.email,
      });

      setStatus({ type: "success", text: "OTP sent to your email successfully." });
      localStorage.setItem("resetEmail", data.email);
      setTimeout(() => navigate("/reset-password"), 1500);
    } catch (err) {
      setStatus({ type: "error", text: err.response?.data?.error || "Failed to send OTP" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden">
        <div className="mb-8 text-center relative z-10">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
            Forgot Password
          </h1>
          <p className="text-gray-400 relative z-10">
            Enter your email to receive an OTP to reset your password.
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
            <ControlledTextField
              field={{
                name: "email",
                type: "email",
                placeholder: "Enter your email",
                validation: {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                },
              }}
              label="Email Address"
              inputClassName={`!bg-input ${!errors.email ? "!border-border focus:!border-primary focus:!ring-primary/20" : ""}`}
            />

            <Button
              disabled={isSubmitting}
              type="submit"
              size="lg"
              className="w-full mt-6"
            >
              {isSubmitting ? "Sending..." : "Send Reset OTP"}
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

export default ForgotPassword;
