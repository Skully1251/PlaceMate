import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

function Hero() {
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const btnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo(titleRef.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1 })
        .fromTo(taglineRef.current, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
        .fromTo(btnRef.current, { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.6 }, '-=0.3');
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 px-4">
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 ref={titleRef} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#FFFFF0] leading-tight mb-12">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet text-transparent bg-clip-text drop-shadow-sm">PlaceMate AI</span>
        </h1>

        <p ref={taglineRef} className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-14 leading-relaxed">
          AI-Based End-to-End Career Preparation and Placement Platform <br />
          End-to-End Placement Solution
        </p>

        <div ref={btnRef}>
          <button
            onClick={() => {
              const token = localStorage.getItem('token');
              if (token) {
                navigate('/dashboard');
              } else {
                navigate('/login');
              }
            }}
            className="group inline-flex items-center gap-2 px-8 py-4 text-lg font-bold text-white bg-violet rounded-2xl shadow-2xl shadow-violet/30 hover:bg-violet/90 hover:shadow-violet/50 hover:scale-105 transition-all duration-300"
          >
            <span>Get Started</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
