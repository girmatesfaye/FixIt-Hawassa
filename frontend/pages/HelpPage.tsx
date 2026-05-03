import React from "react";
import { Link } from "react-router-dom";

const HelpPage: React.FC = () => {
  return (
    <div className="min-h-full bg-white dark:bg-background-dark font-sans flex flex-col">
      {/* Header */}
      <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="size-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">help_center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-4">
            How can we help you today?
          </h1>
          <p className="text-lg font-medium text-gray-500 max-w-2xl mx-auto">
            Find answers to common questions, learn how to use the platform, or get in touch with our support team in Hawassa.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto w-full px-6 py-12 space-y-12">
        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="portal-panel rounded-3xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all group">
            <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">account_circle</span>
            </div>
            <h3 className="text-xl font-bold text-[#120e1b] dark:text-white mb-3">Account & Profile</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Learn how to manage your account, update your professional profile, and verify your identity.
            </p>
            <ul className="space-y-3 text-sm font-semibold text-primary">
              <li className="flex items-center gap-2 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
                How to change my profile picture
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
                Updating my service categories
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
                Resetting my password
              </li>
            </ul>
          </div>

          <div className="portal-panel rounded-3xl p-8 border border-gray-100 dark:border-gray-800 hover:shadow-lg transition-all group">
            <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">payments</span>
            </div>
            <h3 className="text-xl font-bold text-[#120e1b] dark:text-white mb-3">Service Requests</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Everything you need to know about accepting jobs, messaging clients, and completing requests.
            </p>
            <ul className="space-y-3 text-sm font-semibold text-primary">
              <li className="flex items-center gap-2 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
                Understanding request statuses
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
                Messaging clients effectively
              </li>
              <li className="flex items-center gap-2 cursor-pointer hover:underline">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
                How to mark a job as completed
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-[2rem] p-8 sm:p-12 border border-primary/10 text-center">
          <h2 className="text-2xl font-extrabold text-[#120e1b] dark:text-white mb-4">Still need help?</h2>
          <p className="text-gray-600 dark:text-gray-400 font-medium mb-8 max-w-xl mx-auto">
            Our support team is available 24/7 to assist you with any issues or questions you may have.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="mailto:support@fixit-hawassa.com"
              className="w-full sm:w-auto h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-xl">mail</span>
              Email Support
            </a>
            <a 
              href="tel:+251911111111"
              className="w-full sm:w-auto h-12 px-8 bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 text-[#120e1b] dark:text-white rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:shadow-md transition-all"
            >
              <span className="material-symbols-outlined text-xl">call</span>
              Call support
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-[#120e1b] dark:text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "Is FixIt Hawassa free for workers?",
                a: "Yes, currently joining the platform and receiving requests is free for all verified professionals in Hawassa."
              },
              {
                q: "How do I get more job invitations?",
                a: "Make sure your profile is 100% complete with a clear bio, all your skills listed, and photos of your past work in the portfolio gallery."
              },
              {
                q: "What should I do if a client doesn't confirm completion?",
                a: "If you've marked the job as completed and the client hasn't responded within 48 hours, please contact support with proof of work."
              }
            ].map((faq, i) => (
              <div key={i} className="portal-panel rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                <h4 className="text-base font-bold text-[#120e1b] dark:text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-8 text-center border-t border-gray-100 dark:border-gray-800 text-gray-400 text-xs font-bold uppercase tracking-widest">
        &copy; 2026 FixIt Hawassa. Built with ❤️ for our community.
      </footer>
    </div>
  );
};

export default HelpPage;
