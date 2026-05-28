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
