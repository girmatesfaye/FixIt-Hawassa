import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate, Link } from "react-router-dom";
import { RequestDraft } from "../types";
import {
  LAST_CREATED_REQUEST_ID_KEY,
  LAST_REQUEST_KEY,
} from "../services/recommendation";
import { clearSession, getAuthToken } from "../services/auth";
import { getUploadedImageUrl, uploadImage } from "../services/upload";
import toast from "react-hot-toast";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const ServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const navCategory = (location.state as { category?: string } | null)
    ?.category;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    navCategory || null,
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  let savedCategory: string | undefined = undefined;
  try {
    const savedDraftJson = localStorage.getItem(LAST_REQUEST_KEY);
    if (savedDraftJson) {
      const parsed = JSON.parse(savedDraftJson) as RequestDraft;
      savedCategory = parsed?.category;
    }
  } catch {
    savedCategory = undefined;
  }

  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [description, setDescription] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [maintenanceLevel, setMaintenanceLevel] = useState("New");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [locationHint, setLocationHint] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedCategory) {
      setLoadingCategories(true);
      fetch(`${API_BASE_URL}/requests/categories`)
        .then((res) => res.json())
        .then((data) => {
          if (data.categories) {
            setCategories(data.categories);
          }
        })
        .catch((err) => console.error("Failed to load categories:", err))
        .finally(() => setLoadingCategories(false));
    }
  }, [selectedCategory]);

  const currentCategory = selectedCategory || "General Fixes";
  const findWorkersLabel = `Find ${currentCategory} Pros`;
  const categoryLabel = currentCategory.trim() || "General service";
  const categoryIcon = currentCategory.toLowerCase().includes("plumb")
    ? "plumbing"
    : currentCategory.toLowerCase().includes("elect")
      ? "bolt"
      : currentCategory.toLowerCase().includes("paint")
        ? "format_paint"
        : currentCategory.toLowerCase().includes("clean")
          ? "cleaning_services"
          : currentCategory.toLowerCase().includes("carpen")
            ? "carpenter"
            : "build";

  const reverseGeocodeOpenStreetMap = async (
    latitude: number,
    longitude: number,
  ): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      );
      if (!response.ok) {
        return null;
      }

      const data = (await response.json().catch(() => null)) as {
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          suburb?: string;
          state?: string;
          country?: string;
        };
      } | null;

      if (!data?.address) {
        return null;
      }

      // Bounding box for Hawassa area
      // Roughly: Lat [6.9, 7.2], Lon [38.3, 38.6]
      const isWithinHawassaBounds =
        latitude >= 6.9 &&
        latitude <= 7.2 &&
        longitude >= 38.3 &&
        longitude <= 38.6;

      if (!isWithinHawassaBounds) {
        toast.error(
          "Muyaye is currently optimized for Hawassa. Please ensure your location is within the city limits.",
        );
        return null;
      }

      return data.display_name?.trim() || null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
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

  const handleBack = () => navigate("/dashboard");

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) {
      return;
    }

    setIsUploadingPhotos(true);
    if (formError) {
      setFormError("");
    }

    try {
      const uploaded: string[] = [];
      const remainingSlots = Math.max(0, 3 - photoUrls.length);
      const selectedFiles = Array.from(files).slice(0, remainingSlots);

      for (const file of selectedFiles) {
        uploaded.push(await uploadImage(file));
      }

      setPhotoUrls((current) => [...current, ...uploaded].slice(0, 3));
    } catch (_error) {
      setFormError("Could not upload one of the images. Please try again.");
      toast.error("Image upload failed.");
    } finally {
      setIsUploadingPhotos(false);
      e.target.value = "";
    }
  };

  const removePhoto = (photoUrl: string) => {
    setPhotoUrls((current) => current.filter((url) => url !== photoUrl));
  };

  const handleFindWorkers = async () => {
    if (description.trim().length < 20) {
      setFormError("Please describe the issue with at least 20 characters.");
      return;
    }

    if (area.trim().length < 2) {
      setFormError("Please enter your neighborhood or area.");
      return;
    }

    if (!landmark.trim()) {
      setFormError("Please add your house number or landmark.");
      return;
    }

    const requestDraft: RequestDraft = {
      category: currentCategory,
      description: description.trim(),
      area,
      landmark: landmark.trim(),
      maintenanceLevel: maintenanceLevel as "New" | "Medium" | "Old",
      hasPhotos: photoUrls.length > 0,
      photoUrls,
      createdAt: new Date().toISOString(),
    };

    const authToken = getAuthToken();
    if (!authToken) {
      setFormError("Your session has expired. Please login again.");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    try {
      const response = await fetch(`${API_BASE_URL}/requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestDraft),
      });

      const result = (await response.json().catch(() => null)) as {
        message?: string;
        id?: string;
      } | null;

      if (!response.ok) {
        if (response.status === 401) {
          clearSession();
          const msg = "Your session has expired. Please login again.";
          setFormError(msg);
          toast.error(msg);
          navigate("/login");
          return;
        }

        const msg =
          result?.message ?? "Could not submit your request. Please try again.";
        setFormError(msg);
        toast.error(msg);
        return;
      }

      toast.success("Request submitted successfully!");

      localStorage.setItem(LAST_REQUEST_KEY, JSON.stringify(requestDraft));
      if (result?.id) {
        localStorage.setItem(LAST_CREATED_REQUEST_ID_KEY, result.id);
      }

      navigate("/search-results", {
        state: {
          requestDraft,
          requestId: result?.id,
        },
      });
    } catch (_error) {
      setFormError("Could not connect to server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -z-10"></div>
          <div
            className={`absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500 ${selectedCategory ? "w-1/2" : "w-0"}`}
          ></div>

          <div className="flex flex-col items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm transition-colors ${selectedCategory ? "bg-primary text-white" : "bg-white dark:bg-gray-800 border-2 border-primary text-primary ring-4 ring-primary/10"}`}
            >
              {selectedCategory ? (
                <span className="material-symbols-outlined text-base">
                  check
                </span>
              ) : (
                1
              )}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory ? "text-primary" : "text-gray-400"}`}
            >
              Category
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-sm transition-colors ${selectedCategory ? "bg-primary text-white ring-4 ring-primary/20" : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400"}`}
            >
              2
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${selectedCategory ? "text-[#120e1b] dark:text-white" : "text-gray-400"}`}
            >
              Details
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 flex items-center justify-center text-sm">
              3
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Confirm
            </span>
          </div>
        </div>

        {!selectedCategory ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">
                What can we help you with?
              </h1>
              <p className="text-sm text-gray-500 font-medium max-w-md mx-auto">
                Select a service category to find the best verified pros in
                Hawassa for your needs.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {loadingCategories
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-32 rounded-3xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                    ></div>
                  ))
                : (() => {
                    const defaultCategories = [
                      { id: "default-1", name: "Plumbing", icon: "plumbing" },
                      { id: "default-2", name: "Electrical", icon: "bolt" },
                      {
                        id: "default-3",
                        name: "Painting",
                        icon: "format_paint",
                      },
                      {
                        id: "default-4",
                        name: "Cleaning",
                        icon: "cleaning_services",
                      },
                      { id: "default-5", name: "Carpentry", icon: "carpenter" },
                      {
                        id: "default-6",
                        name: "Masonry",
                        icon: "architecture",
                      },
                      { id: "default-7", name: "General Fixes", icon: "build" },
                    ];

                    const merged = [...defaultCategories];
                    categories.forEach((dynamic) => {
                      if (
                        !merged.find(
                          (m) =>
                            m.name.toLowerCase() === dynamic.name.toLowerCase(),
                        )
                      ) {
                        merged.push(dynamic);
                      }
                    });

                    return merged;
                  })().map((svc, index) => {
                    const colors = [
                      "bg-blue-50 text-blue-500 dark:bg-blue-500/10",
                      "bg-amber-50 text-amber-500 dark:bg-amber-500/10",
                      "bg-orange-50 text-orange-500 dark:bg-orange-500/10",
                      "bg-purple-50 text-purple-500 dark:bg-purple-500/10",
                      "bg-green-50 text-green-500 dark:bg-green-500/10",
                      "bg-slate-50 text-slate-500 dark:bg-slate-500/10",
                    ];
                    const color = colors[index % colors.length];
                    return (
                      <button
                        key={svc.id || svc.name}
                        onClick={() => setSelectedCategory(svc.name)}
                        className="group flex flex-col items-center text-center gap-4 p-6 rounded-3xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                      >
                        <div
                          className={`size-14 rounded-2xl ${color} flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-sm`}
                        >
                          <span className="material-symbols-outlined text-3xl">
                            {svc.icon || "build"}
                          </span>
                        </div>
                        <p className="text-sm font-bold dark:text-white leading-tight">
                          {svc.name}
                        </p>
                      </button>
                    );
                  })}
            </div>

            <div className="pt-4 flex justify-center">
              <Link
                to="/dashboard"
                className="text-xs font-bold text-gray-400 hover:text-primary uppercase tracking-widest transition-colors"
              >
                Cancel and return to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Title Section */}
            <div className="flex items-start sm:items-center gap-4 mb-8">
              <button
                onClick={() => setSelectedCategory(null)}
                className="size-11 rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-400 flex items-center justify-center hover:text-primary transition-colors shrink-0"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div className="size-11 rounded-2xl bg-blue-50 text-primary flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-outlined">
                  {categoryIcon}
                </span>
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary mb-2">
                  {categoryLabel}
                </span>
                <h1 className="text-2xl font-bold text-[#120e1b] dark:text-white">
                  Describe Your Problem
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                  Providing details helps {currentCategory} pros give accurate
                  quotes.
                </p>
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              {/* Issue Description */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold mb-4 text-[#120e1b] dark:text-white">
                  What seems to be the issue?
                </h3>
                <div className="relative">
                  <textarea
                    maxLength={500}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (formError) setFormError("");
                    }}
                    placeholder={`E.g., Describe your ${categoryLabel.toLowerCase()} issue clearly, when it started, and what has already been tried...`}
                    className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-primary dark:text-white text-sm resize-none"
                  />
                  <div className="text-right mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                    {description.length}/500 characters
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-bold text-[#120e1b] dark:text-white">
                    Add Photos{" "}
                    <span className="text-gray-400 font-medium">
                      (Optional)
                    </span>
                  </h3>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">
                    Max 3 images
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="col-span-2 sm:col-span-1 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-4 sm:p-8 gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors h-32 sm:h-auto">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhotos || photoUrls.length >= 3}
                    />
                    <span className="material-symbols-outlined text-gray-400 text-3xl">
                      {isUploadingPhotos ? "hourglass_empty" : "add_a_photo"}
                    </span>
                    <p className="text-[10px] font-bold text-gray-500 text-center">
                      {isUploadingPhotos
                        ? "Uploading..."
                        : photoUrls.length >= 3
                          ? "Max reached"
                          : "Upload Photos"}
                    </p>
                  </label>
                  {photoUrls.length
                    ? photoUrls.map((photoUrl) => (
                        <div
                          key={photoUrl}
                          className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 group"
                        >
                          <img
                            src={getUploadedImageUrl(photoUrl)}
                            alt="Service request"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(photoUrl)}
                            className="absolute top-1.5 right-1.5 size-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors"
                          >
                            <span className="material-symbols-outlined text-sm">
                              close
                            </span>
                          </button>
                        </div>
                      ))
                    : Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="hidden sm:flex relative aspect-square rounded-xl overflow-hidden border border-dashed border-gray-200 dark:border-gray-700 items-center justify-center text-gray-300"
                        >
                          <span className="material-symbols-outlined text-3xl">
                            image
                          </span>
                        </div>
                      ))}
                </div>
              </div>

              {/* Location */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold mb-4 text-[#120e1b] dark:text-white">
                  Location
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                        domain
                      </span>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => {
                          setArea(e.target.value);
                          if (formError) setFormError("");
                        }}
                        placeholder="Neighborhood / Area"
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-primary dark:text-white text-sm"
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
                    {locationHint ? (
                      <p className="text-xs text-[#609966] dark:text-gray-400">
                        {locationHint}
                      </p>
                    ) : null}
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                      home
                    </span>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => {
                        setLandmark(e.target.value);
                        if (formError) setFormError("");
                      }}
                      placeholder="House Number / Landmark"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-primary dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Level */}
              <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-bold mb-4 text-[#120e1b] dark:text-white">
                  Maintenance Level
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <MaintenanceCard
                    icon="add_circle"
                    title="New"
                    desc="Installation or first-time setup"
                    active={maintenanceLevel === "New"}
                    onClick={() => setMaintenanceLevel("New")}
                  />
                  <MaintenanceCard
                    icon="construction"
                    title="Medium"
                    desc="Routine maintenance or minor wear"
                    active={maintenanceLevel === "Medium"}
                    onClick={() => setMaintenanceLevel("Medium")}
                  />
                  <MaintenanceCard
                    icon="history"
                    title="Old"
                    desc="Repairing older systems or heavy wear"
                    active={maintenanceLevel === "Old"}
                    onClick={() => setMaintenanceLevel("Old")}
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 pb-12">
                {formError ? (
                  <p className="mb-3 text-sm font-medium text-red-600">
                    {formError}
                  </p>
                ) : null}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gradient-to-b from-white to-gray-50/70 dark:from-surface-dark dark:to-gray-900/30 p-4 sm:p-5">
                  <button
                    onClick={handleFindWorkers}
                    disabled={isSubmitting}
                    className="w-full h-14 bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/30 transition-all transform active:scale-[0.99]"
                  >
                    {isSubmitting ? "Submitting..." : findWorkersLabel}
                    <span className="material-symbols-outlined">
                      arrow_forward
                    </span>
                  </button>
                  <p className="text-center text-[10px] text-gray-400 font-medium mt-4 leading-relaxed max-w-sm mx-auto">
                    By clicking "{findWorkersLabel}", you agree to our Terms of
                    Service. Your request will be broadcast to verified workers
                    nearby.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const MaintenanceCard: React.FC<{
  icon: string;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, title, desc, active, onClick }) => (
  <div
    onClick={onClick}
    className={`relative flex flex-col gap-3 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
      active
        ? "border-primary bg-blue-50/50 dark:bg-primary/5 ring-4 ring-primary/5"
        : "border-gray-50 bg-gray-50/50 dark:bg-gray-800/30 dark:border-gray-800"
    }`}
  >
    <div
      className={`size-10 rounded-full flex items-center justify-center ${active ? "bg-primary text-white" : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300"}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </div>
    <div>
      <h4 className="text-sm font-bold text-[#120e1b] dark:text-white">
        {title}
      </h4>
      <p className="text-[10px] font-medium text-gray-500 leading-normal">
        {desc}
      </p>
    </div>
    <div className="absolute top-4 right-4">
      <div
        className={`size-5 rounded-full border-2 flex items-center justify-center ${active ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"}`}
      >
        {active && <div className="size-2 rounded-full bg-white" />}
      </div>
    </div>
  </div>
);

export default ServiceRequestPage;
