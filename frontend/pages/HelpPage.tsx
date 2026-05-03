import React, { useState } from "react";

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
    <div className="portal-panel rounded-[2rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
      <div className={`size-14 rounded-2xl ${iconColor} flex items-center justify-center mb-6`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-2xl font-extrabold text-[#120e1b] dark:text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm font-medium leading-relaxed mb-8">
        {description}
      </p>
      
      <div className="space-y-3">
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
                expandedIdx === idx ? "max-h-40 opacity-100 pb-5 px-5" : "max-h-0 opacity-0 pointer-events-none"
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
  const accountQuestions = [
    {
      q: "How do I change my profile picture?",
      a: "Go to your 'Edit Profile' page, click the camera icon on your current photo, and upload a clear, professional image of yourself. Don't forget to click 'Save Changes' at the top."
    },
    {
      q: "Updating my service categories",
      a: "In your profile settings, you can select or deselect categories like 'Plumbing' or 'Electrical'. You can also type custom skills separated by commas to help clients find your specific expertise."
    },
    {
      q: "How do I show as 'Available'?",
      a: "On your Worker Hub, there is a large green toggle. When it's ON, you appear in search results. Turn it OFF if you are busy or on a break to stop receiving new requests."
    }
  ];

  const serviceQuestions = [
    {
      q: "Understanding request statuses",
      a: "'Searching' means looking for a pro. 'Pending' means an invite was sent to you. 'In Progress' means you accepted the job. 'Completed' means the work is finished."
    },
    {
      q: "How to mark a job as completed?",
      a: "Once you finish the physical work, go to your Worker Hub and click the 'Complete Job' button on that specific request. The client will then be notified to confirm and leave a review."
    },
    {
      q: "Messaging clients effectively",
      a: "Always introduce yourself politely, confirm the appointment time, and ask for specific details about the location or the nature of the repair before you head out."
    }
  ];

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
            How can we <span className="text-primary">help you</span> today?
          </h1>
          <p className="text-lg sm:text-xl font-medium text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions about the FixIt Hawassa platform or get in touch with our local support team.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto w-full px-6 py-16 space-y-16">
        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <HelpSection 
            title="Account & Profile"
            icon="account_circle"
            iconColor="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            description="Manage your professional presence, security settings, and verification status in the Hawassa community."
            questions={accountQuestions}
          />
          <HelpSection 
            title="Service Requests"
            icon="construction"
            iconColor="bg-green-50 dark:bg-green-900/20 text-green-600"
            description="Guidelines on accepting invites, managing active jobs, and ensuring high-quality service delivery."
            questions={serviceQuestions}
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
                Send an Email
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

        {/* FAQ Section */}
        <div className="space-y-10">
          <h2 className="text-3xl font-extrabold text-[#120e1b] dark:text-white text-center tracking-tight">General FAQ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                q: "Is it free for workers?",
                a: "Yes! Currently, joining FixIt and receiving requests in Hawassa is completely free for all verified professionals."
              },
              {
                q: "How to get more jobs?",
                a: "Complete your profile, upload a gallery of your best work, and maintain a fast response time to client messages."
              },
              {
                q: "Client didn't confirm?",
                a: "If you finished the work but the client hasn't clicked 'Confirm', contact support and we will verify the completion for you."
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
