import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import ControlledTextField from "../component/ui/ControlledTextField";
import ControlledPasswordField from "../component/ui/ControlledPasswordField";
import Button from "../component/ui/Button";
import api from "../utils/api";

const Register = () => {
  const methods = useForm();
  const { formState: { errors, isSubmitting } } = methods;
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password
      });

      const result = response.data;

      if (result.requireOtp) {
        localStorage.setItem('authEmail', data.email);
        navigate('/verify-otp');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="mb-8 text-center relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join Meetx today</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5 relative z-10">
            <ControlledTextField
              field={{
                name: "name",
                placeholder: "Enter your full name",
                validation: { required: "Name is required" }
              }}
              label="Full Name"
              inputClassName={`!bg-input ${!errors.name ? '!border-border focus:!border-primary focus:!ring-primary/20' : ''}`}
            />

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
                placeholder: "Create a password",
                validation: {
                  required: "Password is required",
                  minLength: { value: 6, message: "Must be at least 6 characters" }
                }
              }}
              label="Password"
              inputClassName={`!bg-input ${!errors.password ? '!border-border focus:!border-primary focus:!ring-primary/20' : ''}`}
            />

            <Button disabled={isSubmitting} type="submit" size="lg" className="w-full mt-6">
              {isSubmitting ? "Creating..." : "Sign Up"}
            </Button>
          </form>
        </FormProvider>

        <div className="relative mt-6 z-10">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-gray-400">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isGoogleLoading || isSubmitting}
          className="w-full mt-6 bg-transparent border-border text-white hover:bg-input flex items-center justify-center gap-2 relative z-10 disabled:opacity-50"
          onClick={async () => {
            if (isGoogleLoading) return;
            setIsGoogleLoading(true);
            try {
              const res = await api.get("/auth/google/url");
              window.location.href = res.data.url;
            } catch (err) {
              setErrorMsg("Failed to initialize Google Login");
              setIsGoogleLoading(false);
            }
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Button>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-glow transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
