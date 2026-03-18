
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkerHubPageProps {
  onLogout: () => void;
}

const WorkerHubPage: React.FC<WorkerHubPageProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isAvailable, setIsAvailable] = useState(true);
  const [skills, setSkills] = useState(['Plumbing', 'Pipe Repair', 'Leak Detection']);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div className="flex h-screen bg-[#f8fafd] dark:bg-background-dark font-sans overflow-hidden">
      {/* Minified Sidebar for the Physical Work model */}
      <aside className="w-64 flex flex-col bg-white dark:bg-surface-dark border-r border-gray-100 dark:border-gray-800 shrink-0">
        <div className="p-8 border-b border-gray-50 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
              <span className="material-symbols-outlined font-bold">construction</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#120e1b] dark:text-white">Worker Hub</h2>
              <p className="text-[10px] font-semibold text-green-500 uppercase tracking-widest">FixIt Hawassa</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <nav className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-primary/10 text-primary font-bold text-sm text-left transition-all">
              <span className="material-symbols-outlined">account_circle</span>
              My Profile
            </button>
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-bold text-sm text-left transition-all"
            >
              <span className="material-symbols-outlined">person_search</span>
              Find Help
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-50 dark:border-gray-800">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-5 py-3.5 w-full text-gray-400 hover:text-red-500 font-semibold text-sm transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout Account
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-10 py-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="text-2xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">Shop Presence</h1>
              <p className="text-sm font-bold text-gray-500">How clients see you in Hawassa.</p>
            </div>
            <button 
              onClick={() => navigate('/worker/edit-profile')}
              className="h-11 px-6 bg-[#120e1b] hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
            >
              Update Profile
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-10 flex flex-col gap-10">
          
          {/* Availability Toggle - The most critical part of the Hub */}
          <div className={`rounded-3xl p-8 border-2 transition-all flex items-center justify-between shadow-sm ${
            isAvailable 
              ? 'bg-green-50 border-green-100 dark:bg-green-950/20 dark:border-green-900' 
              : 'bg-gray-50 border-gray-100 dark:bg-gray-900 dark:border-gray-800'
          }`}>
            <div className="flex items-center gap-6">
              <div className={`size-16 rounded-3xl flex items-center justify-center transition-colors ${
                isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                <span className="material-symbols-outlined text-3xl">sensors</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-extrabold tracking-tight dark:text-white">
                  {isAvailable ? 'You are visible to clients' : 'Your profile is hidden'}
                </h3>
                <p className="text-sm font-bold text-gray-500 mt-1">
                  {isAvailable 
                    ? 'Clients can call or message you for physical work.' 
                    : 'Turn this on to appear in Hawassa search results.'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsAvailable(!isAvailable)}
              className={`w-20 h-10 rounded-full relative transition-colors shadow-inner ${isAvailable ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-800'}`}
            >
              <div className={`absolute top-1.5 size-7 bg-white rounded-full shadow-lg transition-all ${isAvailable ? 'left-11' : 'left-1.5'}`} />
            </button>
          </div>

          {!isProfileComplete && (
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900 rounded-3xl p-8 flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="size-14 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                </div>
                <div>
                  <h4 className="text-lg font-extrabold tracking-tight text-amber-900 dark:text-amber-100">Finish setting up your shop</h4>
                  <p className="text-sm font-bold text-amber-700 mt-1">Add photos of your physical work to build trust.</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/worker/edit-profile')}
                className="h-11 px-8 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-amber-500/20"
              >
                Upload Photos
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Overview */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-50 dark:border-gray-800">
                <div className="flex items-start gap-8 mb-8">
                  <div className="size-24 rounded-3xl overflow-hidden shadow-lg border-2 border-white dark:border-gray-700">
                    <img src="https://picsum.photos/id/64/200/200" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-2xl font-extrabold tracking-tight dark:text-white">Abebe Kebede</h2>
                      <span className="material-symbols-outlined text-primary fill-current text-[24px]">verified</span>
                    </div>
                    <p className="text-sm font-bold text-primary mb-4">Master Plumber</p>
                    <div className="flex flex-wrap gap-2">
                      {skills.map(skill => (
                        <span key={skill} className="px-3 py-1 bg-gray-50 dark:bg-gray-800 text-[10px] font-bold uppercase tracking-widest text-gray-500 rounded-lg">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">My Bio</p>
                  <p className="text-sm text-gray-600 leading-relaxed italic">"Providing reliable plumbing services in Hawassa for over 8 years. I specialize in home installations and emergency leak fixes. I am always punctual and offer fair pricing for physical work."</p>
                </div>
              </div>

              {/* Physical Service Gallery - The Proof */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-extrabold tracking-tight dark:text-white">Service Gallery</h3>
                  <button className="text-sm font-bold text-primary">View All</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-square rounded-3xl overflow-hidden bg-gray-100 group relative">
                      <img src={`https://picsum.photos/id/${10+i}/400/400`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  ))}
                  <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-gray-300 gap-2 hover:bg-gray-50 cursor-pointer transition-colors">
                    <span className="material-symbols-outlined text-4xl">add</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Ratings - Performance based on physical work */}
              <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-50 dark:border-gray-800 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Worker Reputation</p>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-5xl font-extrabold tracking-tight dark:text-white">4.9</span>
                  <span className="material-symbols-outlined text-amber-400 text-5xl fill-current">star</span>
                </div>
                <p className="text-[11px] font-bold text-green-500 uppercase tracking-widest mt-2">Excellent Rating</p>
                <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>Profile Views</span>
                    <span className="text-[#120e1b] dark:text-white">124</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-gray-500">
                    <span>Contact Clicks</span>
                    <span className="text-[#120e1b] dark:text-white">42</span>
                  </div>
                </div>
              </div>

              {/* Direct Contact Options */}
              <div className="bg-[#120e1b] rounded-3xl p-8 shadow-xl text-white">
                <h4 className="text-lg font-extrabold tracking-tight mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-500 text-[24px]">contact_phone</span>
                  My Contact Info
                </h4>
                <div className="space-y-4">
                  <div className="p-5 bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone</p>
                    <p className="text-base font-bold tracking-tight">+251 911 234 567</p>
                  </div>
                  <div className="p-5 bg-white/5 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Telegram</p>
                    <p className="text-base font-bold tracking-tight">@abebe_plumb</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-6 leading-relaxed italic">
                  Clients in Hawassa will use these to contact you directly for physical jobs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerHubPage;
