import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { saveSession } from "../services/auth";
import AuthVisual from "../components/AuthVisual";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

interface LoginPageProps {
  onLoginSuccess: (role: "client" | "worker" | "admin") => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (password.trim().length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        token?: string;
        role?: "client" | "worker" | "admin";
        next?: string;
      } | null;

      if (!response.ok || !result?.token) {
        const msg = result?.message ?? "Login failed. Please try again.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Login successful!");
      const resolvedRole = result.role ?? "client";
      const token = result.token;
      
      // Save session
      saveSession(token, resolvedRole);

      // Update global auth state
      onLoginSuccess(resolvedRole);

      // Navigate to destination
      if (resolvedRole === "admin") {
        navigate("/admin/users");
      } else if (resolvedRole === "worker") {
        navigate("/worker-hub");
      } else {
        navigate("/dashboard");
      }
    } catch (_error) {
      setFormError("Could not connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-background-dark font-sans">
      {/* Left Column: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24">
        <div className="max-w-md w-full mx-auto space-y-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="size-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-3xl font-bold">handyman</span>
            </div>
            <h2 className="text-[#40513b] dark:text-white text-xl font-black tracking-tight">FixIt Hawassa</h2>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black text-[#40513b] dark:text-white tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Log in to your account to manage your requests.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Email Address</label>
                <input
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formError) setFormError("");
                  }}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white placeholder-gray-400"
                  placeholder="name@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Password</label>
                  <Link to="/forgot-password" title="Recover your password" size="sm" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors">
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formError) setFormError("");
                    }}
                    className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white placeholder-gray-400 pr-12"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {formError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {formError}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary-dark text-white font-black text-lg transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="pt-4 flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Don't have an account?
              <Link to="/register" className="text-primary font-black hover:underline ml-1.5">Sign up</Link>
            </p>

            <button
              type="button"
              // onClick={() => setFormError("Admin access requires OTP verification.")}
              onClick={() => setFormError("Admin access is restricted.")}
              className="inline-flex items-center gap-1.5 text-[11px] font-black text-gray-400 hover:text-primary uppercase tracking-widest transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              Admin Portal
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Section */}
      <AuthVisual />
    </div>
  );
};

export default LoginPage;
