import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const ForgotPasswordPage: React.FC = () => {
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const phoneDigits = phone.replace(/\D/g, "");
    if (!/^9\d{8}$/.test(phoneDigits)) {
      toast.error("Enter a valid Ethiopian mobile number (9XXXXXXXX).");
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedPhone = `+251${phoneDigits}`;
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSent(true);
        toast.success("Recovery email sent!");
      } else {
        toast.error(data.message || "Failed to process request");
      }
    } catch (error) {
      toast.error("Could not reach server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl font-bold">
              lock_reset
            </span>
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-[#40513b] dark:text-white tracking-tight">
          Forgot Password?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
          Enter your phone number and we'll send a recovery link to your registered email.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-surface-dark py-8 px-4 shadow-xl border border-[#9dc08b66] dark:border-gray-800 sm:rounded-2xl sm:px-10">
          {!isSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-[#40513b] dark:text-gray-200 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-[#609966] dark:text-gray-400 font-medium border-r border-gray-300 dark:border-gray-600 pr-2 mr-2 text-sm">
                      +251
                    </span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-full pl-16 pr-3 py-3 border border-[#9dc08b] dark:border-gray-700 rounded-xl leading-5 bg-[#edf1d6] dark:bg-gray-800 text-gray-900 dark:text-white placeholder-[#609966] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="911 234 567"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? "Sending..." : "Send Recovery Link"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="size-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600">
                <span className="material-symbols-outlined text-4xl">
                  check_circle
                </span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                If an account exists for this number, we have sent a reset link to your email.
              </p>
              <p className="text-xs text-gray-500">
                Please check your inbox (and spam folder). The link is valid for 1 hour.
              </p>
              <Link
                to="/login"
                className="block w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Back to Login
              </Link>
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-surface-dark text-gray-500">
                  Or
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm font-bold text-primary hover:underline"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
