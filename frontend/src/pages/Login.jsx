import React, { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ControlledTextField from "../component/ui/ControlledTextField";
import ControlledPasswordField from "../component/ui/ControlledPasswordField";
import Button from "../component/ui/Button";
import { useUser } from "../context/UserContext";
import api from "../utils/api";

const Login = () => {
  const methods = useForm();
  const {
    formState: { errors, isSubmitting },
  } = methods;
  const navigate = useNavigate();
  const { loginContext } = useUser();
  const [errorMsg, setErrorMsg] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const vite_app_base_url = import.meta.env.VITE_API_URL;
  console.log(vite_app_base_url);

  const onSubmit = async (data) => {
    setErrorMsg("");
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const result = response.data;

      if (result.requireOtp) {
        localStorage.setItem("authEmail", data.email);
        navigate("/verify-otp");
      } else {
        loginContext(result.user, result.token);
        navigate("/");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 text-gray-200 font-sans">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8 border border-border relative overflow-hidden">
        <div className="mb-8 text-center relative z-10 flex flex-col items-center">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <img
            src="/meetlogo.png"
            alt="MeetX Logo"
            className="w-20 h-20 object-contain mb-4 shrink-0 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          />
          <h1 className="text-3xl font-bold text-white mb-2 relative z-10">
            Welcome Back
          </h1>
          <p className="text-gray-400 relative z-10">
            Please sign in to your account
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400 text-sm text-center">
            {errorMsg}
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

            <ControlledPasswordField
              field={{
                name: "password",
                placeholder: "Enter your password",
                validation: {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                },
              }}
              label="Password"
              inputClassName={`!bg-input ${!errors.password ? "!border-border focus:!border-primary focus:!ring-primary/20" : ""}`}
            />

            <div className="flex items-center justify-between mt-2 mb-6">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded bg-input border-border text-primary focus:ring-primary/20 accent-primary"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-gray-400 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:text-primary-glow transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              disabled={isSubmitting}
              type="submit"
              size="lg"
              className="w-full"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
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
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary-glow transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
