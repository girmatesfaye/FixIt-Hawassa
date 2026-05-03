import React, { useState, useEffect } from "react";
import { getStoredRole, UserRole } from "../services/auth";

interface FAQItem {
  q: string;
  a: string;
}

interface HelpSectionProps {
  title: string;
  icon: string;
  iconColor: string;
  description: string;
  questions: FAQItem[];
}

const HelpSection: React.FC<HelpSectionProps> = ({ title, icon, iconColor, description, questions }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="portal-panel rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all h-full flex flex-col">
      <div className={`size-14 rounded-2xl ${iconColor} flex items-center justify-center mb-6`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-2xl font-extrabold text-[#120e1b] dark:text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-8">
        {description}
      </p>
      
      <div className="space-y-3 mt-auto">
        {questions.map((faq, idx) => (
          <div 
            key={idx}
            className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
              expandedIdx === idx 
                ? "border-primary bg-primary/5 dark:bg-primary/10" 
                : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-surface-dark"
            }`}
          >
            <button
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              className="w-full px-5 py-4 flex items-center justify-between text-left group"
            >
              <span className={`text-sm font-bold transition-colors ${expandedIdx === idx ? "text-primary" : "text-[#120e1b] dark:text-white group-hover:text-primary"}`}>
                {faq.q}
              </span>
              <span className={`material-symbols-outlined transition-transform duration-300 ${expandedIdx === idx ? "rotate-180 text-primary" : "text-gray-400"}`}>
                expand_more
              </span>
            </button>
            <div 
              className={`transition-all duration-300 ease-in-out ${
                expandedIdx === idx ? "max-h-60 opacity-100 pb-5 px-5" : "max-h-0 opacity-0 pointer-events-none"
              }`}
            >
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                {faq.a}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HelpPage: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setRole(getStoredRole());
  }, []);

  const accountQuestions = [
    {
      q: "How do I change my profile info?",
      a: "You can update your contact details and location settings directly from your dashboard. Click on your profile icon to access account settings."
    },
    {
      q: "Is my personal information safe?",
      a: "Yes, FixIt Hawassa only shares your contact details with a professional AFTER a request is confirmed or explicitly accepted. Your location is kept private until then."
    },
    {
      q: "Can I use FixIt on mobile?",
      a: "Absolutely! FixIt Hawassa is fully responsive and works perfectly on any smartphone browser. You can request services and chat on the go."
    }
  ];

  const clientBookingQuestions = [
    {
      q: "How do I book a professional?",
      a: "Search for a service like 'Plumbing', browse the recommended workers, and click 'Book Now' on a profile. You'll need to provide a short description and photos of the issue."
    },
    {
      q: "What if the worker doesn't show up?",
      a: "If a worker is a no-show, go to your 'Bookings' page and click 'Report'. Our support team will investigate and help you find a replacement professional."
    },
    {
      q: "How do I pay the worker?",
      a: "Currently, FixIt facilitates the connection. Payment is handled directly between you and the worker (Cash, Telebirr, etc.) once the work is completed and confirmed."
    }
  ];

  const workerQuestions = [
    {
      q: "How to show as 'Available'?",
      a: "On your Worker Hub, there is a large green toggle. When it's ON, you appear in search results. Turn it OFF if you are busy or on a break."
    },
    {
      q: "How to mark a job as completed?",
      a: "Once you finish the work, go to your Worker Hub and click the 'Complete Job' button. The client will then be notified to confirm and leave a review."
    },
    {
      q: "Boosting my profile visibility",
      a: "Complete your profile 100%, upload photos of your past work to the gallery, and ask satisfied clients to leave positive ratings."
    }
  ];

  const isWorker = role === "worker";
  const isClient = role === "client";

  return (
    <div className="min-h-full bg-[#f8faff] dark:bg-background-dark font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-surface-dark border-b border-[#e8edf7] dark:border-gray-800 px-6 py-12 sm:py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 inline-block">
            Support Center
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">
            How can we <span className="text-primary">help you</span>?
          </h1>
          <p className="text-lg sm:text-xl font-medium text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {isWorker 
              ? "Find answers to help you manage your professional presence and succeed as a worker in Hawassa." 
              : "Find answers to help you find the best professionals and manage your service requests in Hawassa."}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-6 py-16 space-y-16">
        {/* Role-Specific Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center max-w-5xl mx-auto">
          {isClient && (
            <HelpSection 
              title="Booking & Services"
              icon="shopping_cart"
              iconColor="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
              description="Learn how to find professionals, book jobs, and manage your service history."
              questions={clientBookingQuestions}
            />
          )}
          {isWorker && (
            <HelpSection 
              title="Work & Reputation"
              icon="construction"
              iconColor="bg-green-50 dark:bg-green-900/20 text-green-600"
              description="Manage your business, accept jobs, and grow your professional rating."
              questions={workerQuestions}
            />
          )}
          <HelpSection 
            title="Account & Safety"
            icon="shield"
            iconColor="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
            description="Details about your account security, privacy, and community guidelines."
            questions={accountQuestions}
          />
        </div>

        {/* Contact Support */}
        <div className="bg-[#120e1b] dark:bg-primary/10 rounded-[3rem] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Still have questions?</h2>
            <p className="text-gray-400 font-medium mb-10 max-w-xl mx-auto text-lg">
              Our Hawassa-based support team is ready to assist you. We usually respond within an hour.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <a 
                href="mailto:support@fixit-hawassa.com"
                className="w-full sm:w-auto h-14 px-10 bg-primary hover:bg-primary-dark text-white rounded-2xl flex items-center justify-center gap-3 text-sm font-bold shadow-xl shadow-primary/30 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">mail</span>
                Email Support
              </a>
              <a 
                href="tel:+251911111111"
                className="w-full sm:w-auto h-14 px-10 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold backdrop-blur-md transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">call</span>
                Call support
              </a>
            </div>
          </div>
        </div>

        {/* Community Standards (Shared) */}
        <div className="space-y-10">
          <h2 className="text-3xl font-extrabold text-[#120e1b] dark:text-white text-center tracking-tight">Community Standards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                q: "Fair Pricing",
                a: "Workers are encouraged to provide fair market rates. Clients should agree on pricing before the work starts to avoid disputes."
              },
              {
                q: "Respectful Behavior",
                a: "Maintain professional communication at all times. Harassment or unprofessional conduct will lead to immediate account suspension."
              },
              {
                q: "Quality Guarantee",
                a: "Workers should stand by their quality. Clients are encouraged to leave honest reviews to help maintain high standards in Hawassa."
              }
            ].map((faq, i) => (
              <div key={i} className="portal-panel rounded-3xl p-8 border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-colors">
                <h4 className="text-sm font-bold text-primary mb-3 uppercase tracking-widest">{faq.q}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-bold">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-12 text-center border-t border-[#e8edf7] dark:border-gray-800 text-gray-400 text-[10px] font-bold uppercase tracking-[3px]">
        &copy; 2026 FixIt Hawassa &bull; Supporting Local Talent
      </footer>
    </div>
  );
};

export default HelpPage;
