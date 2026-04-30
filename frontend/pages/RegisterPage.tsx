import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { saveSession } from "../services/auth";
import toast from "react-hot-toast";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

interface RegisterPageProps {
  onRegisterSuccess: (role: "client" | "worker" | "admin") => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"client" | "worker">("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [category, setCategory] = useState("Plumbing"); // Default category for workers
  const [nationalId, setNationalId] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationHint, setLocationHint] = useState("");

  const reverseGeocodeOpenStreetMap = async (
    latitude: number,
    longitude: number,
  ): Promise<string | null> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    );
    if (!response.ok) {
      return null;
    }

    const data = (await response.json().catch(() => null)) as {
      display_name?: string;
    } | null;

    if (!data?.display_name?.trim()) {
      return null;
    }

    return data.display_name.trim();
  };

  const handleUseCurrentLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocationHint(
        "Geolocation is not supported on this device. Enter location manually.",
      );
      return;
    }

    setIsLocating(true);
    setLocationHint("");
    if (formError) {
      setFormError("");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const osmAddress = await reverseGeocodeOpenStreetMap(
            latitude,
            longitude,
          );

          if (osmAddress) {
            setLocationValue(osmAddress);
            setLocationHint("Location detected and filled from OpenStreetMap.");
            return;
          }

          setLocationValue(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
          setLocationHint(
            "Exact coordinates detected. You can keep this or type neighborhood manually.",
          );
        } catch (_error) {
          setLocationHint(
            "Location detected, but address lookup failed. Enter neighborhood manually if needed.",
          );
        } finally {
          setIsLocating(false);
        }
      },
      (_error) => {
        setIsLocating(false);
        setLocationHint(
          "Location permission was denied. Please type your neighborhood manually.",
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fullName.trim().length < 3) {
      setFormError("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email address.");
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

    const normalizedNationalId = nationalId.trim().toUpperCase();
    if (role === "worker" && normalizedNationalId.length < 6) {
      setFormError("Please enter a valid worker national ID.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const navigateToRoleHome = (nextRole: "client" | "worker" | "admin") => {
        if (nextRole === "admin") {
          navigate("/admin/users");
        } else if (nextRole === "worker") {
          navigate("/worker-hub");
        } else {
          navigate("/dashboard");
        }
      };
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          location: locationValue.trim(),
          area: locationValue.trim(),
          phone: phone.trim(),
          category: role === "worker" ? category : undefined,
          nationalId: role === "worker" ? normalizedNationalId : undefined,
        }),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        requiresOtp?: boolean;
        sessionId?: string;
        token?: string;
        user?: { role?: "client" | "worker" | "admin" };
      } | null;

      if (!response.ok) {
        const msg = result?.message ?? "Registration failed. Please try again.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Registration successful!");

      const resolvedRole = result?.user?.role ?? role;
      const requiresOtp = result?.requiresOtp ?? true;

      if (requiresOtp) {
        navigate("/verify", {
          state: {
            role: resolvedRole,
            sessionId: result?.sessionId ?? "",
          },
        });
        return;
      }

      const token = typeof result?.token === "string" ? result.token : "";
      if (!token) {
        setFormError("Registration succeeded, but login token was missing.");
        return;
      }

      saveSession(token, resolvedRole);
      onRegisterSuccess(resolvedRole);
      navigateToRoleHome(resolvedRole);
    } catch (_error) {
      setFormError(
        `Could not reach backend at ${API_BASE_URL}. Make sure backend is running, then try again.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-background-dark font-sans overflow-x-hidden">
      {/* Left Column: Form Section */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-10 bg-primary/10 text-primary flex items-center justify-center rounded-xl">
              <span className="material-symbols-outlined text-3xl font-bold">handyman</span>
            </div>
            <h2 className="text-[#40513b] dark:text-white text-xl font-black tracking-tight">FixIt Hawassa</h2>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#40513b] dark:text-white tracking-tight">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Join our community of skilled professionals and clients.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Joining as</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${role === "client" ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-gray-100 dark:border-gray-800 text-gray-400"}`}
                  >
                    <span className="material-symbols-outlined text-xl">person</span>
                    Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("worker")}
                    className={`h-14 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold transition-all ${role === "worker" ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/10" : "border-gray-100 dark:border-gray-800 text-gray-400"}`}
                  >
                    <span className="material-symbols-outlined text-xl">engineering</span>
                    Worker
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Full Name</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white"
                  placeholder="Abebe Kebede"
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Email Address</label>
                <input
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white"
                  placeholder="name@example.com"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Location</label>
                <div className="relative">
                  <input
                    required
                    value={locationValue}
                    onChange={(e) => setLocationValue(e.target.value)}
                    className="w-full h-14 pl-12 pr-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white"
                    placeholder="Neighborhood or Area"
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">location_on</span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary hover:text-primary-dark transition-colors"
                    title="Use my location"
                  >
                    <span className="material-symbols-outlined">my_location</span>
                  </button>
                </div>
              </div>

              {role === "worker" && (
                <>
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Main Service Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white appearance-none"
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Painting">Painting</option>
                      <option value="Construction">Construction</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">

                  <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">National ID</label>
                  <input
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value.toUpperCase())}
                    className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white"
                    placeholder="ETH-WORKER-XXXX"
                    type="text"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[#40513b] dark:text-gray-200">Password</label>
                <input
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 focus:border-primary focus:ring-0 transition-all text-base dark:text-white"
                  placeholder="••••••••"
                  type="password"
                />
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
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="pt-4 flex flex-col items-center gap-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Already have an account?
              <Link to="/login" className="text-primary font-black hover:underline ml-1.5">Log in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Visual Section */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#40513b]">
        <img
          alt="Community"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974&auto=format&fit=crop"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#40513b] via-transparent to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-end p-20 text-white">
          <div className="max-w-xl space-y-6">
            <h2 className="text-5xl font-black leading-[1.1] tracking-tight">
              Build your career, <br/>serve your city.
            </h2>
            <p className="text-lg font-medium text-white/80 leading-relaxed max-w-md">
              Whether you are looking for work or looking for help, FixIt is the bridge that connects you to the best of Hawassa.
            </p>
            <div className="pt-10 grid grid-cols-2 gap-10">
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-black">100%</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/50">Verified Users</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-black">Free</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-white/50">To Get Started</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
