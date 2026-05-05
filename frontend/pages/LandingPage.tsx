import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserRole } from "../services/auth";

interface LandingPageProps {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  onLogout: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({
  isAuthenticated,
  userRole,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"client" | "worker">("client");
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542013936693-884638332954?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1600&auto=format&fit=crop"
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const navLinks = [
    { name: "How it Works", href: "#how-it-works" },
    { name: "Services", href: "#services" },
    { name: "About", href: "#about" },
  ];

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin";
    if (userRole === "worker") return "/worker-hub";
    return "/dashboard";
  };

  const clientSteps = [
    {
      number: "01",
      title: "Request a Service",
      desc: "Select a category like plumbing or electrical and describe your specific problem.",
      icon: "edit_note",
      accent: "text-blue-500",
      bg: "bg-blue-50",
      visual: (
        <div className="w-full h-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-2 flex flex-col gap-1.5 shadow-inner">
          <div className="h-2 w-3/4 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-2 w-1/2 bg-gray-100 dark:bg-gray-700 rounded" />
          <div className="h-4 w-full bg-primary/10 rounded border border-primary/20 flex items-center px-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
      ),
    },
    {
      number: "02",
      title: "Find Top Talent",
      desc: "Browse verified local experts. Compare profiles, ratings, and physical work photos.",
      icon: "person_search",
      accent: "text-purple-500",
      bg: "bg-purple-50",
      visual: (
        <div className="w-full h-16 flex items-center justify-around">
          {["Alex", "Sarah", "Jordan"].map((name, i) => (
            <div
              key={name}
              className={`size-10 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden ${i === 1 ? "ring-2 ring-primary scale-110 z-10 bg-white dark:bg-gray-700" : "opacity-60"}`}
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      number: "03",
      title: "Instant Connection",
      desc: "Contact pros directly via call or Telegram. Discuss the price and schedule a visit.",
      icon: "chat_bubble",
      accent: "text-green-500",
      bg: "bg-green-50",
      visual: (
        <div className="w-full h-16 flex items-center justify-center gap-2">
          <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-bold">
            Hello!
          </div>
          <div className="px-3 py-1.5 bg-primary text-white rounded-full text-[10px] font-bold">
            I'm on my way!
          </div>
        </div>
      ),
    },
    {
      number: "04",
      title: "Job Done & Rated",
      desc: "After the physical work is finished, pay the worker and leave a rating for the community.",
      icon: "verified",
      accent: "text-amber-500",
      bg: "bg-amber-50",
      visual: (
        <div className="w-full h-16 flex flex-col items-center justify-center gap-1">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span
                key={s}
                className="material-symbols-outlined text-amber-400 text-sm fill-current"
              >
                star
              </span>
            ))}
          </div>
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            100% Satisfied
          </span>
        </div>
      ),
    },
  ];

  const workerSteps = [
    {
      number: "01",
      title: "Setup Your Shop",
      desc: "Register and set your location in Hawassa so clients nearby can discover you.",
      icon: "storefront",
      accent: "text-teal-500",
      bg: "bg-teal-50",
      visual: (
        <div className="w-full h-16 flex items-center justify-center">
          <div className="size-12 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg">
            <span className="material-symbols-outlined">add_business</span>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      title: "Show Your Skills",
      desc: "Upload real photos of your tools and past jobs. Proof leads to 4x more hires.",
      icon: "photo_library",
      accent: "text-indigo-500",
      bg: "bg-indigo-50",
      visual: (
        <div className="w-full h-16 flex gap-1 items-center justify-center px-4">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded shadow-sm" />
          <div className="flex-1 h-12 bg-gray-300 dark:bg-gray-600 rounded shadow-md z-10" />
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded shadow-sm" />
        </div>
      ),
    },
    {
      number: "03",
      title: "Stay Available",
      desc: 'Toggle your status to "Active" to appear in real-time search results.',
      icon: "sensors",
      accent: "text-green-500",
      bg: "bg-green-50",
      visual: (
        <div className="w-full h-16 flex items-center justify-center">
          <div className="w-12 h-6 bg-green-500 rounded-full relative">
            <div className="absolute top-1 right-1 size-4 bg-white rounded-full shadow" />
          </div>
        </div>
      ),
    },
    {
      number: "04",
      title: "Earn & Grow",
      desc: "Complete jobs, get paid directly, and build a local reputation through ratings.",
      icon: "trending_up",
      accent: "text-primary",
      bg: "bg-primary/5",
      visual: (
        <div className="w-full h-16 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-primary">ETB +++</span>
          <div className="h-1 w-12 bg-primary/20 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-primary w-2/3" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col group/design-root overflow-x-hidden scroll-smooth">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-[#ebe7f3] dark:border-gray-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <div className="px-4 md:px-10 lg:px-40 flex justify-center py-3">
          <div className="layout-content-container flex w-full max-w-[1200px] items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-4">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined">handyman</span>
                </div>
                <h2 className="text-lg font-bold leading-tight tracking-tight text-[#120e1b] dark:text-white">
                  FixIt Hawassa
                </h2>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
              <nav className="flex items-center gap-9">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    className="text-sm font-medium hover:text-primary transition-colors text-[#120e1b] dark:text-white"
                    href={link.href}
                  >
                    {link.name}
                  </a>
                ))}
                {!isAuthenticated ? (
                  <Link
                    className="text-sm font-medium hover:text-primary transition-colors text-[#120e1b] dark:text-white"
                    to="/login"
                  >
                    Login
                  </Link>
                ) : (
                  <Link
                    className="text-sm font-medium hover:text-primary transition-colors text-[#120e1b] dark:text-white"
                    to={getDashboardPath()}
                  >
                    Dashboard
                  </Link>
                )}
              </nav>
              {!isAuthenticated ? (
                <Link
                  to="/register"
                  className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-primary hover:bg-primary-dark transition-colors text-white text-sm font-bold leading-normal tracking-wide shadow-md shadow-primary/20"
                >
                  Sign Up
                </Link>
              ) : (
                <button
                  onClick={onLogout}
                  className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-6 bg-red-500 hover:bg-red-600 transition-colors text-white text-sm font-bold leading-normal tracking-wide shadow-md shadow-red-500/20"
                >
                  Logout
                </button>
              )}
            </div>

            <button
              onClick={toggleMobileMenu}
              className="md:hidden text-[#120e1b] dark:text-white z-50 p-2"
            >
              <span className="material-symbols-outlined text-3xl">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[100] bg-black/60 backdrop-blur-md transition-opacity duration-300 md:hidden ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`absolute right-0 top-0 h-full w-[280px] bg-white dark:bg-surface-dark shadow-2xl transition-transform duration-300 transform p-8 flex flex-col gap-8 ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-lg">handyman</span>
              </div>
              <span className="text-sm font-bold dark:text-white">FixIt</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="size-10 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex flex-col gap-6 mt-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                className="text-lg font-bold text-[#120e1b] dark:text-white hover:text-primary transition-colors"
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            {!isAuthenticated ? (
              <>
                <Link
                  className="text-lg font-bold text-[#120e1b] dark:text-white"
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  className="text-lg font-bold text-primary"
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                <Link
                  className="text-lg font-bold text-[#120e1b] dark:text-white"
                  to={getDashboardPath()}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-lg font-bold text-red-500"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </div>

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative w-full py-16 md:py-32 overflow-hidden bg-background-green">
          <div className="absolute inset-0 z-0">
            {heroImages.map((img, idx) => (
              <img
                key={img}
                src={img}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  idx === currentHeroImage ? "opacity-60" : "opacity-0"
                }`}
                alt="Skilled workers"
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent" />
          </div>
          <div className="relative z-10 px-4 flex justify-center text-center">
            <div className="max-w-4xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-white uppercase tracking-widest">
                  Active across all sub-cities of Hawassa
                </span>
              </div>
              <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-8">
                Skilled Local Help,
                <br /> <span className="text-primary">Always Near You.</span>
              </h1>
              <p className="text-white/80 text-lg md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
                Empowering Hawassa's workers by connecting them with residents
                for quick, reliable services.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={!isAuthenticated ? "/login" : getDashboardPath()}
                  className="h-14 px-8 bg-white text-primary rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg hover:bg-gray-50 transition-all"
                >
                  <span className="material-symbols-outlined">
                    {!isAuthenticated ? "search" : "dashboard"}
                  </span>
                  {!isAuthenticated ? "I Need a Pro" : "My Dashboard"}
                </Link>
                <Link
                  to={!isAuthenticated ? "/register" : getDashboardPath()}
                  className="h-14 px-8 bg-primary text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg hover:bg-primary-dark transition-all"
                >
                  <span className="material-symbols-outlined">
                    {!isAuthenticated ? "engineering" : "hub"}
                  </span>
                  {!isAuthenticated ? "I Want Work" : "Worker Hub"}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Services */}
        <section
          id="services"
          className="py-12 bg-white dark:bg-background-dark border-b border-gray-100 dark:border-gray-800 scroll-mt-20 overflow-hidden"
        >
          <div className="max-w-[100vw] mx-auto py-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-8 text-center">
              Popular Categories
            </h3>
            <div className="relative flex w-full overflow-hidden">
              <div className="flex whitespace-nowrap animate-marquee gap-6 items-center w-max">
                {[
                  ...["Plumbing", "Electrical", "Painting", "Cleaning", "Carpentry", "Masonry", "General Fixes"],
                  ...["Plumbing", "Electrical", "Painting", "Cleaning", "Carpentry", "Masonry", "General Fixes"],
                  ...["Plumbing", "Electrical", "Painting", "Cleaning", "Carpentry", "Masonry", "General Fixes"],
                  ...["Plumbing", "Electrical", "Painting", "Cleaning", "Carpentry", "Masonry", "General Fixes"],
                ].map((svc, index) => (
                  <button
                    key={`${svc}-${index}`}
                    className="shrink-0 px-8 py-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:border-primary hover:text-primary transition-all text-base font-bold flex items-center gap-3 shadow-md"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {svc === "Plumbing"
                        ? "plumbing"
                        : svc === "Electrical"
                          ? "bolt"
                          : svc === "Painting"
                            ? "format_paint"
                            : "construction"}
                    </span>
                    {svc}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-25%); }
            }
            .animate-marquee {
              animation: marquee 20s linear infinite;
            }
          `}} />
        </section>

        {/* Expanded How it Works */}
        <section
          id="how-it-works"
          className="py-16 md:py-32 bg-white dark:bg-background-dark scroll-mt-20"
        >
          <div className="px-4 max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Process Guide
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#120e1b] dark:text-white tracking-tight">
                How it works
              </h2>
              <div className="flex justify-center mt-8">
                <div className="p-1.5 bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("client")}
                    className={`flex-1 sm:flex-none px-5 sm:px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "client" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    I am a Client
                  </button>
                  <button
                    onClick={() => setActiveTab("worker")}
                    className={`flex-1 sm:flex-none px-5 sm:px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === "worker" ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
                  >
                    I am a Worker
                  </button>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Connector line for desktop */}
              <div className="hidden lg:block absolute top-[110px] left-0 w-full h-0.5 border-t-2 border-dashed border-gray-200 dark:border-gray-800 -z-0" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
                {(activeTab === "client" ? clientSteps : workerSteps).map(
                  (step, idx) => (
                    <div
                      key={step.title}
                      className="flex flex-col items-center lg:items-start group"
                    >
                      <div
                        className={`size-20 rounded-3xl ${step.bg} flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 border border-white dark:border-gray-700`}
                      >
                        <span
                          className={`material-symbols-outlined text-4xl ${step.accent}`}
                        >
                          {step.icon}
                        </span>
                        <div className="absolute -top-3 -right-3 size-8 rounded-full bg-white dark:bg-surface-dark border-2 border-gray-50 dark:border-gray-700 flex items-center justify-center shadow-sm">
                          <span className="text-xs font-bold text-gray-400">
                            {step.number}
                          </span>
                        </div>
                      </div>

                      <div className="text-center lg:text-left space-y-3 mb-6">
                        <h3 className="text-lg font-bold text-[#120e1b] dark:text-white group-hover:text-primary transition-colors tracking-tight">
                          {step.title}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      <div className="w-full mt-auto bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-4 transform group-hover:translate-y-[-4px] transition-transform duration-300 shadow-sm">
                        <p className="text-xs font-semibold uppercase text-gray-500 mb-3 tracking-wider">
                          Visual Preview
                        </p>
                        {step.visual}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="mt-20 text-center">
              <Link
                to={!isAuthenticated ? (activeTab === "client" ? "/login" : "/register") : getDashboardPath()}
                className="inline-flex h-14 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold uppercase tracking-wider items-center gap-3 shadow-lg shadow-primary/20 transition-all transform hover:scale-105 active:scale-95"
              >
                {!isAuthenticated ? (
                  activeTab === "client"
                    ? "Hire a Professional"
                    : "Start Working Today"
                ) : (
                  "Go to My Dashboard"
                )}
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features (About) */}
        <section
          id="about"
          className="py-24 bg-white dark:bg-background-dark scroll-mt-20"
        >
          <div className="px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <span className="material-symbols-outlined">verified_user</span>
              </div>
              <h3 className="text-lg font-bold dark:text-white">
                Verified Specialists
              </h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                We manually verify the ID and basic skillsets of workers to
                ensure a safe community for Hawassa.
              </p>
            </div>
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <h3 className="text-lg font-bold dark:text-white">
                Lightning Fast
              </h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Most requests in Piassa and Tabor are picked up by workers
                within 15 minutes of posting.
              </p>
            </div>
            <div className="space-y-4">
              <div className="size-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center border border-green-100">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <h3 className="text-lg font-bold dark:text-white tracking-tight">
                Fair Pricing
              </h3>
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Transparency is key. Discuss the total cost of physical work
                directly before any tools are touched.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 py-6">
        <div className="px-4 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-3">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm">handyman</span>
              </div>
              <h2 className="text-xl font-black dark:text-white">
                FixIt Hawassa
              </h2>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Bridging skills and needs
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" className="text-gray-400 hover:text-primary transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center md:text-right">
            © 2026 FixIt Hawassa.<br className="md:hidden" /> Built for Hawassa residents.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
