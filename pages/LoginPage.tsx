import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = phone.replace(/\D/g, "");
    if (!/^9\d{8}$/.test(phoneDigits)) {
      setFormError("Enter a valid Ethiopian mobile number (9XXXXXXXX).");
      return;
    }

    if (password.trim().length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const normalizedPhone = `+251${phoneDigits}`;
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
          password: password.trim(),
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        sessionId?: string;
        role?: "client" | "worker" | "admin";
      } | null;

      if (!response.ok || !result?.sessionId) {
        setFormError(result?.message ?? "Login failed. Please try again.");
        return;
      }

      navigate("/verify", {
        state: {
          role: result.role ?? "client",
          sessionId: result.sessionId,
        },
      });
    } catch (_error) {
      setFormError("Could not connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      <header className="w-full bg-white dark:bg-[#1a2230] border-b border-[#e7ebf3] dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10 lg:fixed lg:top-0">
        <div className="flex items-center gap-3">
          <div className="size-8 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl font-bold">
              handyman
            </span>
          </div>
          <h2 className="text-[#0d121b] dark:text-white text-lg font-bold leading-tight">
            FixIt Hawassa
          </h2>
        </div>
        <button
          type="button"
          className="text-sm font-medium text-[#4c669a] dark:text-gray-400 hover:text-primary"
        >
          Help
        </button>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row min-h-[calc(100vh-65px)] lg:min-h-screen">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary">
          <img
            alt="Hawassa Cityscape"
            className="absolute inset-0 w-full h-full object-cover"
            src="https://picsum.photos/id/10/1600/1200"
          />
          <div className="absolute inset-0 hero-overlay flex flex-col justify-end p-16 text-white">
            <div className="max-w-md">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6">
                Connecting Hawassa's Best Talent with You
              </h2>
              <p className="text-base lg:text-lg font-medium text-white/90">
                Find skilled informal workers for any task. Reliable, verified,
                and just a click away.
              </p>
            </div>
            <div className="mt-12 flex gap-8">
              <div className="flex flex-col">
                <span className="text-2xl lg:text-3xl font-bold">500+</span>
                <span className="text-xs uppercase tracking-wider text-white/80">
                  Verified Pros
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl lg:text-3xl font-bold">24/7</span>
                <span className="text-xs uppercase tracking-wider text-white/80">
                  Support
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-grow flex items-center justify-center p-4 sm:p-8 lg:w-1/2 lg:pt-24 bg-background-light dark:bg-background-dark">
          <div className="w-full max-w-[440px] bg-white dark:bg-[#1a2230] rounded-xl shadow-sm border border-[#e7ebf3] dark:border-gray-800 p-6 sm:p-10 flex flex-col gap-8">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-[#0d121b] dark:text-white text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                Welcome Back
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
                Log in to your FixIt account
              </p>
            </div>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-5">
                <label className="flex flex-col gap-2">
                  <span className="text-[#0d121b] dark:text-white text-sm font-semibold">
                    Phone Number
                  </span>
                  <div className="relative flex w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-[#4c669a] dark:text-gray-400 font-medium border-r border-gray-300 dark:border-gray-600 pr-2 mr-2 text-sm">
                        +251
                      </span>
                    </div>
                    <input
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="form-input flex w-full rounded-lg border border-[#cfd7e7] dark:border-gray-700 bg-[#f8f9fc] dark:bg-gray-800 focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-16 pr-4 text-base dark:text-white placeholder-[#4c669a] dark:placeholder-gray-500"
                      placeholder="911 234 567"
                      type="tel"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-[#0d121b] dark:text-white text-sm font-semibold">
                    Password
                  </span>
                  <div className="relative">
                    <input
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="form-input flex w-full rounded-lg border border-[#cfd7e7] dark:border-gray-700 bg-[#f8f9fc] dark:bg-gray-800 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base dark:text-white placeholder-[#4c669a] dark:placeholder-gray-500 pr-10"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4c669a] dark:text-gray-400 hover:text-primary"
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                      >
                        {showPassword ? "visibility" : "visibility_off"}
                      </span>
                    </button>
                  </div>
                </label>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:text-blue-700 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {formError ? (
                  <p className="text-sm font-medium text-red-600">
                    {formError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center justify-center w-full h-12 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-base transition-colors shadow-sm"
                >
                  {isSubmitting ? "Logging In..." : "Log In"}
                </button>
              </div>
            </form>

            <div className="border-t border-[#e7ebf3] dark:border-gray-800 pt-6 text-center space-y-4">
              <p className="text-sm text-[#0d121b] dark:text-gray-300">
                Don't have an account?
                <Link
                  className="text-primary font-bold hover:underline ml-1"
                  to="/register"
                >
                  Sign up
                </Link>
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setFormError(
                      "Admin access requires phone/password login and OTP verification.",
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-primary uppercase tracking-wider transition-colors"
                  aria-label="Admin access"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    admin_panel_settings
                  </span>
                  Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
