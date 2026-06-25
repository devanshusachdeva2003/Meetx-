import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ControlledTextField from "../component/ui/ControlledTextField";
import ControlledPasswordField from "../component/ui/ControlledPasswordField";
import Button from "../component/ui/Button";
import api from "../utils/api";

const Register = () => {
  const methods = useForm();
  const {
    formState: { errors, isSubmitting },
  } = methods;
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const response = await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });

      const result = response.data;

      if (result.requireOtp) {
        localStorage.setItem("authEmail", data.email);
        navigate("/verify-otp");
      } else {
        navigate("/login");
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
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="space-y-5 relative z-10"
          >
            <ControlledTextField
              field={{
                name: "name",
                placeholder: "Enter your full name",
                validation: { required: "Name is required" },
              }}
              label="Full Name"
              inputClassName={`!bg-input ${!errors.name ? "!border-border focus:!border-primary focus:!ring-primary/20" : ""}`}
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
                    message: "Invalid email address",
                  },
                },
              }}
              label="Email Address"
              inputClassName={`!bg-input ${!errors.email ? "!border-border focus:!border-primary focus:!ring-primary/20" : ""}`}
            />

            <ControlledPasswordField
              field={{
                name: "password",
                placeholder: "Create a password",
                validation: {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Must be at least 6 characters",
                  },
                },
              }}
              label="Password"
              inputClassName={`!bg-input ${!errors.password ? "!border-border focus:!border-primary focus:!ring-primary/20" : ""}`}
            />

            <Button
              disabled={isSubmitting}
              type="submit"
              size="lg"
              className="w-full mt-6"
            >
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
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
          )}
          {isGoogleLoading ? "Connecting to Google..." : "Google"}
        </Button>

        <p className="mt-8 text-center text-sm text-gray-400 relative z-10">
          Already have an account?{" "}
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

export default Register;
