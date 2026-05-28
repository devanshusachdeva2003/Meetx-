import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import ControlledTextField from "../component/ui/ControlledTextField";
import ControlledPasswordField from "../component/ui/ControlledPasswordField";
import Button from "../component/ui/Button";
import { useUser } from "../context/UserContext";
import api from "../utils/api";

const Login = () => {
  const methods = useForm();
  const { formState: { errors, isSubmitting } } = methods;
  const navigate = useNavigate();
  const { loginContext } = useUser();
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      const result = response.data;

      if (result.requireOtp) {
        localStorage.setItem('authEmail', data.email);
        navigate('/verify-otp');
      } else {
        loginContext(result.user, result.token);
        navigate('/');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden">
        <div className="mb-8 text-center relative z-10">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Welcome Back</h1>
          <p className="text-gray-400 relative z-10">Please sign in to your account</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
            <ControlledTextField
              field={{
                name: "email",
                type: "email",
                placeholder: "Enter your email",
                validation: {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                }
              }}
              label="Email Address"
              inputClassName={`!bg-input ${!errors.email ? '!border-border focus:!border-primary focus:!ring-primary/20' : ''}`}
            />

            <ControlledPasswordField
              field={{
                name: "password",
                placeholder: "Enter your password",
                validation: {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                }
              }}
              label="Password"
              inputClassName={`!bg-input ${!errors.password ? '!border-border focus:!border-primary focus:!ring-primary/20' : ''}`}
            />

            <div className="flex items-center justify-between mt-2 mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary/20 accent-primary"
                />
                <label htmlFor="remember-me" className="ml-2 text-sm text-gray-400 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-primary hover:text-primary-glow transition-colors">
                Forgot password?
              </a>
            </div>

            <Button disabled={isSubmitting} type="submit" size="lg" className="w-full">
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </FormProvider>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-primary hover:text-primary-glow transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
