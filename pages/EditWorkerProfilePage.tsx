import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const EditWorkerProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([
    "General Plumbing",
    "Pipe Fitting",
    "Leak Repair",
  ]);
  const [bio, setBio] = useState("");

  const popularSuggestions = ["Water Heater", "Sewage", "Tiling"];

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const addSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills([...skills, skill]);
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
              onClick={() => navigate("/worker-hub")}
              className="px-6 h-10 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Save Changes
            </button>
            <div className="size-10 rounded-full bg-[#fef2f2] border border-orange-100 flex items-center justify-center text-orange-400 overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Abebe"
                alt="User"
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
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute bottom-2 right-2 size-10 bg-primary text-white rounded-full border-4 border-white dark:border-surface-dark flex items-center justify-center hover:bg-primary-dark transition-colors shadow-lg">
                  <span className="material-symbols-outlined text-xl">
                    photo_camera
                  </span>
                </button>
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
                    defaultValue="Abebe Kebede"
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
                      defaultValue="+251 911 234 567"
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
                    <select className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white appearance-none">
                      <option>Menharia</option>
                      <option>Tabor</option>
                      <option>Misrak</option>
                      <option>Bahil Adarash</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                      expand_more
                    </span>
                  </div>
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
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Bio
                    </label>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {bio.length}/300
                    </span>
                  </div>
                  <textarea
                    maxLength={300}
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
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search skills (e.g. Plumbing, Painting...)"
                    className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-[#10b981] text-sm font-semibold dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/10 text-[#065f46] dark:text-green-400 text-xs font-bold rounded-lg border border-green-100 dark:border-green-800"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Popular Suggestions
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {popularSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => addSkill(s)}
                        className="px-4 py-2 rounded-lg border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
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
                  2/10 uploaded
                </span>
              </div>

              <div className="space-y-6">
                <div className="w-full aspect-[2/1] bg-gray-50 dark:bg-gray-800/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
                  <div className="size-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-2xl">
                      cloud_upload
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700 dark:text-white">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs font-medium text-gray-400 mt-1">
                      SVG, PNG, JPG or GIF (max. 3MB)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&h=400&auto=format&fit=crop"
                      className="w-full h-full object-cover"
                      alt="Portfolio 1"
                    />
                  </div>
                  <div className="aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
                    <img
                      src="https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=400&h=400&auto=format&fit=crop"
                      className="w-full h-full object-cover"
                      alt="Portfolio 2"
                    />
                  </div>
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl flex items-center justify-center text-gray-300">
                    <span className="material-symbols-outlined text-4xl">
                      image
                    </span>
                  </div>
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
