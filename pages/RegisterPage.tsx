import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"client" | "worker">("client");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length < 3) {
      setFormError("Please enter your full name.");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    if (!/^9\d{8}$/.test(phoneDigits)) {
      setFormError("Enter a valid Ethiopian mobile number (9XXXXXXXX).");
      return;
    }

    if (locationValue.trim().length < 2) {
      setFormError("Please enter your neighborhood or area.");
      return;
    }

    if (password.trim().length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    setFormError("");
    navigate("/verify", { state: { role } });
  };

  return (
    <div className="bg-white dark:bg-background-dark font-sans text-[#0d121b] dark:text-white min-h-screen flex flex-col">
      <header className="w-full bg-white/80 dark:bg-[#1a2230]/80 backdrop-blur-md border-b border-[#e7ebf3] dark:border-gray-800 px-6 py-4 flex items-center justify-between fixed top-0 z-50">
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
        <a
          className="text-sm font-medium text-[#4c669a] dark:text-gray-400 hover:text-primary transition-colors"
          href="#"
        >
          Help
        </a>
      </header>

      <main className="flex-grow flex pt-[68px]">
        <div className="flex w-full min-h-[calc(100vh-68px)]">
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
            <img
              alt="Skilled worker"
              className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
              src="https://picsum.photos/id/1/1600/1200"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#101622] via-[#101622]/20 to-transparent"></div>
            <div className="relative z-10 p-16 flex flex-col justify-end h-full max-w-2xl">
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/30 rounded-full w-fit">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                  <span className="text-white text-xs font-bold uppercase tracking-wider">
                    Join our growing community
                  </span>
                </div>
                <h2 className="text-white text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                  Empowering Hawassa's skilled hands.
                </h2>
                <p className="text-white/80 text-xl leading-relaxed">
                  Connecting local expertise with residential and commercial
                  projects. Your next big opportunity or your quick fix is just
                  a click away.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background-light dark:bg-background-dark overflow-y-auto">
            <div className="w-full max-w-[480px] bg-white dark:bg-[#1a2230] rounded-2xl shadow-xl lg:shadow-2xl border border-[#e7ebf3] dark:border-gray-800 p-8 sm:p-10 flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h1 className="text-[#0d121b] dark:text-white text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                  Join FixIt Hawassa
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base font-medium">
                  Start connecting with skilled workers today.
                </p>
              </div>

              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-3">
                  <label className="text-[#0d121b] dark:text-white text-sm font-semibold">
                    I am joining as a...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setRole("client")}
                    >
                      <div
                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${role === "client" ? "border-primary bg-blue-50 dark:bg-primary/10 text-primary" : "border-[#e7ebf3] dark:border-gray-700 bg-white dark:bg-[#111827] text-[#4c669a] dark:text-gray-400"}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "32px" }}
                        >
                          person
                        </span>
                        <span className="text-sm font-semibold">Client</span>
                      </div>
                      {role === "client" && (
                        <div className="absolute top-3 right-3 text-primary">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "20px" }}
                          >
                            check_circle
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setRole("worker")}
                    >
                      <div
                        className={`flex flex-col items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all ${role === "worker" ? "border-primary bg-blue-50 dark:bg-primary/10 text-primary" : "border-[#e7ebf3] dark:border-gray-700 bg-white dark:bg-[#111827] text-[#4c669a] dark:text-gray-400"}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "32px" }}
                        >
                          home_repair_service
                        </span>
                        <span className="text-sm font-semibold">Worker</span>
                      </div>
                      {role === "worker" && (
                        <div className="absolute top-3 right-3 text-primary">
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "20px" }}
                          >
                            check_circle
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="flex flex-col gap-2">
                    <span className="text-[#0d121b] dark:text-white text-sm font-semibold">
                      Full Name
                    </span>
                    <input
                      required
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="form-input flex w-full rounded-lg border border-[#cfd7e7] dark:border-gray-700 bg-[#f8f9fc] dark:bg-gray-800 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base dark:text-white placeholder-[#4c669a]"
                      placeholder="e.g. Abebe Bikila"
                      type="text"
                    />
                  </label>
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
                        className="form-input flex w-full rounded-lg border border-[#cfd7e7] dark:border-gray-700 bg-[#f8f9fc] dark:bg-gray-800 focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-16 pr-4 text-base dark:text-white placeholder-[#4c669a]"
                        placeholder="911 234 567"
                        type="tel"
                      />
                    </div>
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-[#0d121b] dark:text-white text-sm font-semibold">
                      Location (Neighborhood/Area)
                    </span>
                    <input
                      required
                      value={locationValue}
                      onChange={(e) => {
                        setLocationValue(e.target.value);
                        if (formError) setFormError("");
                      }}
                      className="form-input flex w-full rounded-lg border border-[#cfd7e7] dark:border-gray-700 bg-[#f8f9fc] dark:bg-gray-800 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base dark:text-white placeholder-[#4c669a]"
                      placeholder="e.g., Piazza or Tabor"
                      type="text"
                    />
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
                        className="form-input flex w-full rounded-lg border border-[#cfd7e7] dark:border-gray-700 bg-[#f8f9fc] dark:bg-gray-800 focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 text-base dark:text-white placeholder-[#4c669a] pr-10"
                        placeholder="Create a strong password"
                        type="password"
                      />
                      <button
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4c669a] dark:text-gray-400 hover:text-primary"
                        type="button"
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "20px" }}
                        >
                          visibility_off
                        </span>
                      </button>
                    </div>
                  </label>
                </div>

                <div className="pt-2 flex flex-col gap-4">
                  {formError ? (
                    <p className="text-sm font-medium text-red-600">
                      {formError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    className="flex items-center justify-center w-full h-12 rounded-lg bg-primary hover:bg-primary-dark text-white font-medium text-base transition-colors shadow-sm shadow-primary/20"
                  >
                    Create Account
                  </button>
                  <p className="text-center text-xs text-[#4c669a] dark:text-gray-500">
                    By continuing, you agree to our{" "}
                    <a className="underline hover:text-primary" href="#">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a className="underline hover:text-primary" href="#">
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </form>

              <div className="border-t border-[#e7ebf3] dark:border-gray-800 pt-6 text-center">
                <p className="text-sm text-[#0d121b] dark:text-gray-300">
                  Already have an account?
                  <Link
                    className="text-primary font-bold hover:underline ml-1"
                    to="/login"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterPage;
