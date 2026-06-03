import React, { useState, useEffect } from "react";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop",
    title: "Quality service,\nwhenever you need it.",
    subtitle:
      "Connecting you with the most reliable professionals in the city for plumbing, electrical, cleaning, and more.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2070&auto=format&fit=crop",
    title: "Expert Plumbers,\nReady to Help.",
    subtitle:
      "From leaky faucets to full pipe installations, get the job done right the first time.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=2069&auto=format&fit=crop",
    title: "Certified Electricians,\nSafe & Reliable.",
    subtitle:
      "Fast response for electrical emergencies and professional wiring for your home or office.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?q=80&w=1974&auto=format&fit=crop",
    title: "Professional Cleaning,\nSpotless Results.",
    subtitle:
      "Deep cleaning services tailored to make your living and working spaces shine.",
  },
];

const AuthVisual: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:block lg:w-1/2 relative bg-[#40513b] overflow-hidden">
      {slides.map((slide, index) => (
        <img
          key={index}
          alt={`FixIt Hawassa Service ${index}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-60" : "opacity-0"
          }`}
          src={slide.image}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-[#40513b] via-transparent to-transparent z-10"></div>

      <div className="absolute inset-0 flex flex-col justify-end p-20 text-white z-20">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-widest">
              Available in Hawassa
            </span>
          </div>

          <div className="relative h-40">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-700 transform ${
                  index === currentSlide
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-4 pointer-events-none"
                }`}
              >
                <h2 className="text-5xl font-black leading-[1.1] tracking-tight whitespace-pre-line">
                  {slide.title}
                </h2>
                <p className="text-lg font-medium text-white/80 leading-relaxed max-w-md mt-6">
                  {slide.subtitle}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8 bg-primary" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>

          <div className="pt-6 flex items-center gap-10">
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-black">500+</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50">
                Verified Pros
              </span>
            </div>
            <div className="w-px h-10 bg-white/20"></div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-black">2.4k</span>
              <span className="text-[10px] uppercase font-black tracking-widest text-white/50">
                Completed Tasks
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthVisual;
