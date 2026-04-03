
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const WorkerProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(5);

  const worker = {
    name: 'Abebe Kebede',
    title: 'Electrician & Home Repair Specialist',
    rating: 4.8,
    reviews: 120,
    location: 'Hawassa, Piassa',
    isAvailable: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop',
    about: 'Over 10 years of experience fixing electrical issues in the Hawassa area. I specialize in wiring, installation, and maintenance for both residential and commercial properties. I am certified by the Ethiopian Electric Utility and take pride in delivering safe, high-quality work.',
    aboutExtended: 'Whether you need a simple bulb replacement, a complex circuit board fix, or full home wiring, I am here to help. I am punctual, honest, and offer fair pricing for all my services.',
    serviceId: '#FH-8821',
    tiktokUrl: 'https://tiktok.com/@abebe_fixes'
  };

  const portfolioItems = [
    { id: 1, url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800&h=600&auto=format&fit=crop', title: 'Home Rewiring Project' },
    { id: 2, url: 'https://images.unsplash.com/photo-1558403194-611308249627?q=80&w=800&h=600&auto=format&fit=crop', title: 'Industrial Control Panel' },
    { id: 3, url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?q=80&w=800&h=600&auto=format&fit=crop', title: 'Custom Lighting Installation' },
    { id: 4, url: 'https://images.unsplash.com/photo-1454165833767-13143896b369?q=80&w=800&h=600&auto=format&fit=crop', title: 'Emergency Repair Service' },
    { id: 5, url: 'https://images.unsplash.com/photo-1610033104523-958b4f1416e9?q=80&w=800&h=600&auto=format&fit=crop', title: 'Outdoor Security Lighting' }
  ];

  const recentReviews = [
    {
      id: 1,
      name: 'Tigist M.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Tigist',
      date: 'Oct 12, 2023',
      rating: 5,
      comment: 'Fast and reliable service! He arrived on time and fixed the short circuit that was causing power outages in my kitchen. Highly recommended.'
    },
    {
      id: 2,
      name: 'Dawit A.',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dawit',
      date: 'Sep 28, 2023',
      rating: 4,
      comment: 'Fixed my lights in 20 minutes. Very professional behavior. Price was a bit higher than expected but worth the quality.'
    }
  ];

  const nextImage = () => {
    if (selectedGalleryIdx !== null) {
      setSelectedGalleryIdx((selectedGalleryIdx + 1) % portfolioItems.length);
    }
  };

  const prevImage = () => {
    if (selectedGalleryIdx !== null) {
      setSelectedGalleryIdx((selectedGalleryIdx - 1 + portfolioItems.length) % portfolioItems.length);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafd] dark:bg-background-dark font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-[1280px] mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="size-9 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined font-bold">handyman</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight dark:text-white">FixIt Hawassa</h2>
            </Link>
          </div>

          <div className="flex-grow max-w-md hidden md:block">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search workers..."
                className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-primary dark:text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
             <Link to="/login" className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-bold transition-all shadow-sm">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-grow flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="relative shrink-0">
                <div className="size-40 rounded-full border-4 border-white dark:border-gray-700 shadow-lg overflow-hidden">
                  <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-2 right-2 size-6 bg-green-500 border-4 border-white dark:border-surface-dark rounded-full"></div>
              </div>
              <div className="flex flex-col items-center sm:items-start gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">{worker.name}</h1>
                  </div>
                  <div className="inline-flex items-center gap-3 ml-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Available</span>
                    <button className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${worker.isAvailable ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}>
                      <div className={`bg-white size-5 rounded-full shadow-md transform transition-transform ${worker.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-500 dark:text-gray-400">{worker.title}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-100 dark:border-amber-500/20">
                    <span className="material-symbols-outlined text-amber-500 text-[18px] fill-current">star</span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400 ml-1">{worker.rating}</span>
                    <span className="text-xs font-semibold text-amber-600/70 dark:text-amber-400/70 ml-1">({worker.reviews} reviews)</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    <span className="text-sm font-semibold">{worker.location}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">About Me</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{worker.about}</p>
            </div>

            {/* Portfolio Section */}
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white">Proof of Work</h3>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{portfolioItems.length} Projects</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioItems.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedGalleryIdx(idx)}
                    className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all"
                  >
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="material-symbols-outlined text-white text-3xl">visibility</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-8">Recent Reviews</h3>
              <div className="flex flex-col gap-6">
                 {recentReviews.map(review => (
                  <div key={review.id} className="border-b border-gray-50 dark:border-gray-800 pb-6 last:border-0 last:pb-0">
                    <p className="text-sm font-bold text-[#120e1b] dark:text-white mb-2">{review.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[360px] flex flex-col gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-800 sticky top-24">
              <h3 className="text-xl font-extrabold tracking-tight text-[#120e1b] dark:text-white mb-6">Contact {worker.name.split(' ')[0]}</h3>
              
              <div className="flex flex-col gap-3 mb-6">
                <button 
                  onClick={() => setIsContactOpen(!isContactOpen)}
                  className={`h-14 w-full flex items-center justify-between px-6 rounded-xl font-bold uppercase tracking-widest transition-all ${
                    isContactOpen ? 'bg-gray-100 dark:bg-gray-800 text-primary' : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">{isContactOpen ? 'contact_mail' : 'person_add'}</span>
                    Contact Worker
                  </div>
                  <span className={`material-symbols-outlined transition-transform duration-300 ${isContactOpen ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>

                <div className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
                  isContactOpen ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0 pointer-events-none'
                }`}>
                  <a 
                    href={`tel:+251911234567`}
                    className="group relative h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-green-500/25 active:scale-95 overflow-hidden text-sm"
                  >
                    <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="material-symbols-outlined relative z-10 text-[20px]">call</span> 
                    <span className="relative z-10">Call +251 911...</span>
                  </a>
                  
                  <a 
                    href="https://t.me/abebe_kebede"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative h-14 bg-[#26a5e4] hover:bg-[#1e8ec5] text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#26a5e4]/25 active:scale-95 overflow-hidden text-sm"
                  >
                    <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="material-symbols-outlined relative z-10 text-[20px]">send</span> 
                    <span className="relative z-10">Telegram Message</span>
                  </a>

                  <a 
                    href={worker.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative h-14 bg-[#120e1b] dark:bg-gray-800 dark:hover:bg-gray-700 text-white rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg shadow-black/20 active:scale-95 overflow-hidden border border-transparent dark:border-gray-700 text-sm"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <span className="material-symbols-outlined relative z-10 text-[20px]">movie</span> 
                    <span className="relative z-10">Watch on TikTok</span>
                  </a>
                </div>
              </div>



              <button 
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full h-14 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-amber-500 dark:hover:border-amber-500 text-[#120e1b] dark:text-white hover:text-amber-500 rounded-xl font-bold uppercase tracking-widest text-xs transition-colors active:scale-95 flex items-center justify-center gap-2 mb-6"
              >
                <span className="material-symbols-outlined text-[18px]">star</span>
                Write a Review
              </button>

              <div className="flex justify-center">
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                  Report Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox Modal */}
      {selectedGalleryIdx !== null && (
        <div 
          className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={() => setSelectedGalleryIdx(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-primary transition-colors z-[70]">
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center p-4 md:p-12" onClick={e => e.stopPropagation()}>
             <button 
              onClick={prevImage}
              className="absolute left-4 md:left-8 size-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all z-[70]"
            >
              <span className="material-symbols-outlined text-3xl">chevron_left</span>
            </button>

            <div className="flex flex-col items-center gap-6 max-h-full max-w-full">
              <img 
                src={portfolioItems[selectedGalleryIdx].url} 
                alt={portfolioItems[selectedGalleryIdx].title} 
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
              />
              <div className="text-center">
                <h4 className="text-white text-2xl font-bold tracking-tight mb-2">{portfolioItems[selectedGalleryIdx].title}</h4>
                <p className="text-white/60 text-sm font-semibold uppercase tracking-widest">Project {selectedGalleryIdx + 1} of {portfolioItems.length}</p>
              </div>
            </div>

            <button 
              onClick={nextImage}
              className="absolute right-4 md:right-8 size-14 rounded-full bg-white/10 hover:bg-white text-white hover:text-black flex items-center justify-center transition-all z-[70]"
            >
              <span className="material-symbols-outlined text-3xl">chevron_right</span>
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Rate This Worker">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500 mb-4">How was your experience with {worker.name}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  onClick={() => setRatingValue(star)}
                  className="transition-transform active:scale-125"
                >
                  <span className={`material-symbols-outlined text-4xl ${star <= ratingValue ? 'text-amber-400 fill-current' : 'text-gray-200'}`}>
                    star
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Comments</label>
            <textarea 
              placeholder="Tell others about the physical work done, punctuality, and quality..."
              className="w-full h-32 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-amber-500 text-sm resize-none dark:text-white"
            />
          </div>

          <button 
            onClick={() => setIsReviewModalOpen(false)}
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95"
          >
            Submit Review
          </button>
        </div>
      </Modal>

      {/* Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Report Profile">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="size-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm">
              <img src={worker.avatar} alt={worker.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h4 className="text-base font-bold text-[#120e1b] dark:text-white truncate">{worker.name}</h4>
              <p className="text-[10px] font-medium text-primary uppercase tracking-widest">{worker.title}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Reason</label>
              <select className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-red-500 text-sm font-medium dark:text-white appearance-none">
                <option>Select a reason...</option>
                <option>Overcharging</option>
                <option>Unprofessional Behavior</option>
                <option>Poor Quality of Work</option>
                <option>No-show / Delay</option>
                <option>Inaccurate Profile</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</label>
              <textarea 
                placeholder="What happened?"
                className="w-full h-28 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-none ring-1 ring-gray-100 dark:ring-gray-700 focus:ring-2 focus:ring-red-500 text-sm resize-none dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              Submit Report
            </button>
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="w-full h-10 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex gap-2">
            <span className="material-symbols-outlined text-red-500 text-[18px]">info</span>
            <p className="text-[10px] text-red-700 dark:text-red-400 font-semibold leading-tight">
              Reports are reviewed by admins. False reporting may lead to account suspension.
            </p>
          </div>
        </div>
      </Modal>

      <footer className="bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 py-10 mt-12 text-center">
        <p className="text-sm text-gray-400 font-medium">© 2024 FixIt Hawassa.</p>
      </footer>
    </div>
  );
};

export default WorkerProfilePage;
