import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getMyWorkerProfile,
  updateMyWorkerProfile,
  uploadImage,
} from "../services/worker";

const EditWorkerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [area, setArea] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [tiktokProfile, setTiktokProfile] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [avatar, setAvatar] = useState("");
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const API_BASE_URL =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    "http://localhost:4000";

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; description?: string; icon?: string }>
  >([]);
  const [categoryLoadState, setCategoryLoadState] = useState<
    "loading" | "ready" | "error"
  >("loading");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingPortfolio, setIsUploadingPortfolio] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationHint, setLocationHint] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const json = await res.json();
        setCategories(Array.isArray(json.categories) ? json.categories : []);
        setCategoryLoadState("ready");
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setCategoryLoadState("error");
      }
    };

    void loadCategories();
  }, []);

  useEffect(() => {
    getMyWorkerProfile()
      .then((data) => {
        setFullName(data.name || "");
        setContactNumber(data.phone || "");
        setArea(data.profile.area || "");
        setTelegramUsername(data.profile.telegramUsername || "");
        setTiktokProfile(data.profile.tiktokProfile || "");
        setBio(data.profile.bio || "");
        setSkills(data.profile.skills || []);
        setAvatar(data.profile.avatar || "");
        setPortfolio(data.profile.portfolio || []);
      })
      .catch((err) => console.error("Failed to fetch profile", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMyWorkerProfile({
        name: fullName,
        phone: contactNumber,
        area,
        telegramUsername,
        tiktokProfile,
        bio,
        skills,
        avatar,
        portfolio,
      });
      navigate("/worker-hub");
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

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

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const osmAddress = await reverseGeocodeOpenStreetMap(
            latitude,
            longitude,
          );

          if (osmAddress) {
            setArea(osmAddress);
            setLocationHint("Location detected and filled from OpenStreetMap.");
            return;
          }

          setArea(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
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

  const toggleCategory = (name: string) => {
    if (skills.includes(name)) setSkills(skills.filter((s) => s !== name));
    else setSkills([...skills, name]);
  };

  const handleSkillsInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextSkills = event.target.value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    setSkills(Array.from(new Set(nextSkills)));
  };

  const getImageUrl = (path: string) => {
    if (!path)
      return "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop";
    if (path.startsWith("http")) return path;
    const API_BASE_URL =
      (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
      "http://localhost:4000";
    return `${API_BASE_URL}${path}`;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const url = await uploadImage(file);
      setAvatar(url);
    } catch (error) {
      console.error(error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePortfolioUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingPortfolio(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImage(files[i]);
        newUrls.push(url);
      }
      setPortfolio((prev) => [...prev, ...newUrls].slice(0, 10)); // max 10
    } catch (error) {
      console.error(error);
      alert("Failed to upload portfolio images");
    } finally {
      setIsUploadingPortfolio(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/worker-hub" className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined font-bold text-xl">
                construction
              </span>
            </div>
            <h2 className="text-base font-bold tracking-tight text-primary">
              FixIt Hawassa
            </h2>
          </Link>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-6 h-10 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <div className="size-10 rounded-full bg-[#fef2f2] border border-orange-100 flex items-center justify-center text-orange-400 overflow-hidden">
              <img
                src={getImageUrl(avatar)}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-4">
          <Link to="/worker-hub" className="hover:underline">
            Home
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-400">Profile</span>
        </nav>

        <h1 className="text-4xl font-bold text-[#120e1b] dark:text-white mb-2">
          Edit Profile
        </h1>
        <p className="text-sm font-medium text-gray-500 mb-10">
          Update your public presence and qualifications for clients in Hawassa.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-5 space-y-8">
            {/* Profile Photo Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
              <div className="relative inline-block mb-4">
                <div className="size-32 rounded-full overflow-hidden border-4 border-[#f8fafd] dark:border-gray-800 shadow-md">
                  <img
                    src={getImageUrl(avatar)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    style={{ opacity: isUploadingAvatar ? 0.5 : 1 }}
                  />
                </div>
                <label className="absolute bottom-2 right-2 size-10 bg-primary text-white rounded-full border-4 border-white dark:border-surface-dark flex items-center justify-center hover:bg-primary-dark transition-colors shadow-lg cursor-pointer">
                  <span className="material-symbols-outlined text-xl">
                    {isUploadingAvatar ? "hourglass_empty" : "photo_camera"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                  />
                </label>
              </div>
              <h3 className="text-sm font-bold text-[#120e1b] dark:text-white">
                Profile Photo
              </h3>
              <p className="text-[10px] font-semibold text-primary mt-1 uppercase tracking-wider">
                This will be displayed on your public profile card.
              </p>
            </div>

            {/* Personal Details Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">
                  person
                </span>
                <h3 className="text-lg font-bold text-[#120e1b] dark:text-white">
                  Personal Details
                </h3>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Contact Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white pr-10"
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xl fill-current">
                      check_circle
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Location (Sub-city)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Neighborhood / Area"
                      className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="self-start mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary disabled:text-gray-400"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      my_location
                    </span>
                    {isLocating
                      ? "Detecting location..."
                      : "Use current location"}
                  </button>
                  {locationHint && (
                    <p className="text-xs text-[#4c669a] dark:text-gray-400">
                      {locationHint}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Telegram Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                      @
                    </span>
                    <input
                      type="text"
                      placeholder="username"
                      value={telegramUsername}
                      onChange={(e) => setTelegramUsername(e.target.value)}
                      className="w-full h-12 pl-8 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    TikTok Profile Link
                  </label>
                  <input
                    type="text"
                    placeholder="https://www.tiktok.com/@username"
                    value={tiktokProfile}
                    onChange={(e) => setTiktokProfile(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Bio
                    </label>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {bio?.length || 0}/300
                    </span>
                  </div>
                  <textarea
                    maxLength={300}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell clients about your experience, specialties, and why they should hire you..."
                    className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-medium dark:text-white resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 space-y-8">
            {/* Skills Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">
                  bolt
                </span>
                <h3 className="text-lg font-bold text-[#120e1b] dark:text-white">
                  Skills & Categories
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Selected categories
                  </label>
                  <input
                    type="text"
                    value={skills.join(", ")}
                    onChange={handleSkillsInputChange}
                    placeholder="Arrange your categories here, separated by commas"
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 text-sm font-semibold dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    You can type, remove, or reorder categories here. Clicking a
                    category below will still add or remove it.
                  </p>
                </div>

                {categoryLoadState === "loading" ? (
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Loading categories from the admin dashboard...
                  </p>
                ) : categories.length ? (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => {
                      const selected = skills.includes(c.name);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategory(c.name)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${selected ? "bg-green-600 text-white" : "border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary"}`}
                        >
                          {selected ? "✓ " : ""}
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-4 py-3">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      No categories found yet.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Create categories in the admin dashboard and they will
                      appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">
                    image
                  </span>
                  <h3 className="text-lg font-bold text-[#120e1b] dark:text-white">
                    Portfolio Gallery
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {portfolio.length}/10 uploaded
                </span>
              </div>

              <div className="space-y-6">
                <label className="w-full aspect-[2/1] bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePortfolioUpload}
                    disabled={isUploadingPortfolio}
                  />
                  <div className="size-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">
                      {isUploadingPortfolio
                        ? "hourglass_empty"
                        : "cloud_upload"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700 dark:text-white">
                      {isUploadingPortfolio
                        ? "Uploading..."
                        : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-xs font-medium text-gray-400 mt-1">
                      SVG, PNG, JPG or GIF (max. 3MB)
                    </p>
                  </div>
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {portfolio.map((imgUrl, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm relative group"
                    >
                      <img
                        src={getImageUrl(imgUrl)}
                        className="w-full h-full object-cover bg-gray-100"
                        alt={`Portfolio ${index + 1}`}
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setPortfolio(portfolio.filter((_, i) => i !== index));
                        }}
                        className="absolute top-2 right-2 size-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <span className="material-symbols-outlined text-sm">
                          delete
                        </span>
                      </button>
                    </div>
                  ))}
                  {Array.from({
                    length: Math.min(10 - portfolio.length, 1),
                  }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-300"
                    >
                      <span className="material-symbols-outlined text-4xl">
                        image
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditWorkerProfilePage;
