import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:4000";

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired token.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Failed to connect to the server. Please try again later.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <div className="size-12 rounded-full border-4 border-gray-100 border-t-primary animate-spin"></div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verifying...</h2>
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verified!</h2>
            <p className="text-gray-500 dark:text-gray-400">{message}</p>
            <Link
              to="/auth/login"
              className="mt-6 w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
            >
              Continue to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="size-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
            <p className="text-red-500">{message}</p>
            <Link
              to="/auth/login"
              className="mt-6 w-full h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-bold transition-all flex items-center justify-center"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
