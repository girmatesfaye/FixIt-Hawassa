import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RequestDraft } from "../types";
import { LAST_REQUEST_KEY } from "../services/recommendation";

const ServiceRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [maintenanceLevel, setMaintenanceLevel] = useState("Medium");
  const [area, setArea] = useState("Piassa");
  const [landmark, setLandmark] = useState("");
  const [formError, setFormError] = useState("");

  const handleBack = () => navigate("/dashboard");
  const handleFindWorkers = () => {
    if (description.trim().length < 20) {
      setFormError("Please describe the issue with at least 20 characters.");
      return;
    }

    if (!landmark.trim()) {
      setFormError("Please add your house number or landmark.");
      return;
    }

    const requestDraft: RequestDraft = {
      category: "Plumbing",
      description: description.trim(),
      area,
      landmark: landmark.trim(),
      maintenanceLevel: maintenanceLevel as "New" | "Medium" | "Old",
      hasPhotos: true,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(LAST_REQUEST_KEY, JSON.stringify(requestDraft));
    navigate("/search-results", { state: { requestDraft } });
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-xl font-bold">
                handyman
              </span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold leading-tight">FixIt Hawassa</h2>
              <p className="text-[10px] text-gray-500 font-medium">
                Service Request
              </p>
            </div>
          </div>
          <button
            onClick={handleBack}
            className="text-sm font-bold text-gray-500 hover:text-primary transition-colors"
          >
            Save & Exit
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-10">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800 -z-10"></div>
          <div className="absolute top-4 left-0 w-1/2 h-0.5 bg-primary -z-10"></div>

          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm">
              <span className="material-symbols-outlined text-base">check</span>
            </div>
            <span className="text-xs font-bold text-primary">Category</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center text-sm ring-4 ring-primary/20">
              2
            </div>
            <span className="text-xs font-bold text-[#120e1b] dark:text-white">
              Details
            </span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 flex items-center justify-center text-sm">
              3
            </div>
            <span className="text-xs font-bold text-gray-400">Confirm</span>
          </div>
        </div>

        {/* Title Section */}
        <div className="flex items-center gap-4 mb-8">
          <div className="size-10 rounded-full bg-blue-50 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">edit_note</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#120e1b] dark:text-white">
              Describe Your Problem
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Providing details helps plumbers give accurate quotes.
            </p>
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {/* Issue Description */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
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
                placeholder="E.g., The kitchen sink pipe is leaking underneath the cabinet. It started dripping yesterday and the water pressure is low..."
                className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-primary dark:text-white text-sm resize-none"
              />
              <div className="text-right mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                {description.length}/500 characters
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#120e1b] dark:text-white">
                Add Photos{" "}
                <span className="text-gray-400 font-medium">(Optional)</span>
              </h3>
              <span className="text-[10px] font-semibold text-gray-400 uppercase">
                Max 3 images
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center p-8 gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-gray-400 text-3xl">
                  add_a_photo
                </span>
                <p className="text-xs font-bold text-gray-500">
                  Click to upload or drag and drop
                </p>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 group">
                <img
                  src="https://picsum.photos/id/122/200/200"
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
                <button className="absolute top-1.5 right-1.5 size-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black transition-colors">
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold mb-4 text-[#120e1b] dark:text-white">
              Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-gray-400">
                  domain
                </span>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-primary dark:text-white text-sm appearance-none"
                >
                  <option>Piassa</option>
                  <option>Tabor</option>
                  <option>Millennium</option>
                  <option>Gudumale</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  expand_more
                </span>
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
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
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
            <button
              onClick={handleFindWorkers}
              className="w-full h-14 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-primary/30 transition-all transform active:scale-95"
            >
              Find Plumbers
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <p className="text-center text-[10px] text-gray-400 font-medium mt-4 leading-relaxed max-w-sm mx-auto">
              By clicking "Find Plumbers", you agree to our Terms of Service.
              Your request will be broadcast to verified workers nearby.
            </p>
          </div>
        </div>
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
