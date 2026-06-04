import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { saveSession } from "../services/auth";
import toast from "react-hot-toast";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

interface VerifyPageProps {
  onVerify: (role: "client" | "worker" | "admin") => void;
}

const VerifyPage: React.FC<VerifyPageProps> = ({ onVerify }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [timer, setTimer] = useState(45);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulated role detection from login/register state
  const verifiedRole =
    location.state?.role === "admin"
      ? "admin"
      : location.state?.role === "worker"
        ? "worker"
        : "client";
  const sessionId =
    typeof location.state?.sessionId === "string"
      ? location.state.sessionId
      : "";

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);
    if (submitError) {
      setSubmitError("");
    }

    // Auto-focus next input
    if (numericValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit.length === 1);

  const handleVerify = async () => {
    const otpValue = otp.join("");

    if (!sessionId) {
      setSubmitError("Verification session expired. Please login again.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          otp: otpValue,
          role: verifiedRole,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        role?: "client" | "worker" | "admin";
        token?: string;
      } | null;

      if (!response.ok) {
        const msg = result?.message ?? "Verification failed. Please try again.";
        setSubmitError(msg);
        toast.error(msg);
        return;
      }

      const resolvedRole = result?.role ?? verifiedRole;
      const token = typeof result?.token === "string" ? result.token : "";
      if (!token) {
        const msg = "Verification failed: missing auth token.";
        setSubmitError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Phone verified successfully!");
      saveSession(token, resolvedRole);
      onVerify(resolvedRole);

      if (resolvedRole === "admin") {
        navigate("/admin/users");
      } else if (resolvedRole === "worker") {
        navigate("/worker-hub");
      } else {
        navigate("/dashboard");
      }
    } catch (_error) {
      setSubmitError("Could not connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

    // Redirect based on role to ensure immediate profile setup
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-sans min-h-screen flex flex-col relative overflow-hidden">
      <div
        className="absolute inset-0 z-0 opacity-[0.08] dark:opacity-[0.05] pointer-events-none bg-center bg-cover bg-no-repeat grayscale"
        style={{
          backgroundImage: `url('https://picsum.photos/id/20/1600/900')`,
        }}
      ></div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-grow w-full px-4 py-12">
        <div className="w-full max-w-[480px] bg-white dark:bg-[#1e1b29] rounded-2xl shadow-xl overflow-hidden border border-[#ebe7f3] dark:border-slate-800">
          <div className="p-8 sm:p-10 flex flex-col items-center">
            <div className="flex items-center gap-3 mb-8">
              <div className="size-8 text-primary bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-xl font-bold">
                  handyman
                </span>
              </div>
              <h2 className="text-[#120e1b] dark:text-white text-xl font-bold">
                Muyaye
              </h2>
            </div>

            <div className="text-center mb-8 w-full">
              <h1 className="text-[#120e1b] dark:text-white tracking-tight text-2xl font-bold mb-3">
                Verify Phone
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                We sent a 6-digit code to your Hawassa mobile number.
              </p>
            </div>

            <div className="w-full mb-8">
              <div className="flex gap-2 sm:gap-3 justify-between">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="flex h-14 w-full min-w-0 bg-[#f9f8fc] dark:bg-slate-800 dark:border-slate-700 dark:text-white text-center rounded-lg border border-[#ebe7f3] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-2xl font-semibold transition-all shadow-sm"
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mb-8 w-full">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                <span className="material-symbols-outlined text-[20px]">
                  timer
                </span>
                <span>
                  Resend in{" "}
                  <span className="text-primary dark:text-[#8b5cf6]">
                    00:{timer.toString().padStart(2, "0")}
                  </span>
                </span>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={!isOtpComplete || isSubmitting}
              className="w-full flex items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-primary enabled:hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition-all enabled:active:scale-[0.98]"
            >
              {isSubmitting ? "Verifying..." : "Verify & Get Started"}
            </button>

            {submitError ? (
              <p className="mt-3 text-sm font-medium text-red-600 text-center">
                {submitError}
              </p>
            ) : null}

            <div className="mt-6">
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white font-medium transition-colors flex items-center gap-1 group"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                  arrow_back
                </span>
                Wrong number?
              </button>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-[#8b5cf6] to-primary"></div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
