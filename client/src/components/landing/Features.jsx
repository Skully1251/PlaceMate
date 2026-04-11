import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'Resume-Based Interview',
    description: 'Upload your resume and get context-aware questions tailored specifically to your projects and experience.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  },
  {
    title: 'Real-Time Voice Analysis',
    description: 'Practice with natural voice conversations. Our AI gives instant feedback on your tone, pacing, and clarity.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>,
  },
  {
    title: 'Comprehensive Feedback',
    description: 'Receive detailed scoring, highlighting your strengths and areas for improvement after every mock session.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
  },
  {
    title: 'Company-Specific Prep',
    description: 'Target your practice with interview questions commonly asked by top companies like Google, Microsoft, and Amazon.',
    icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>,
  },
];

function Features() {
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const titleRef = useRef(null);
  const lineRef = useRef(null);
  const timelineRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        timelineRef.current,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: timelineRef.current,
            start: 'top 80%',
          },
        }
      );

      // Animate the vertical timeline line growing
      gsap.fromTo(
        lineRef.current,
        { height: '0%' },
        {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 60%',
            end: 'bottom 80%',
            scrub: true,
          },
        }
      );

      // Fade and slide in each timeline item left/right
      itemsRef.current.forEach((item, index) => {
        if (!item) return;
        const isLeft = index % 2 === 0;
        gsap.fromTo(
          item,
          { opacity: 0, x: isLeft ? -50 : 50, y: 20 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 85%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 md:py-32 px-4 overflow-hidden">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-muted">Core Capabilities</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
          Powerful <span className="text-violet">Features</span>
        </h2>
      </div>

      <div ref={timelineRef} className="relative max-w-5xl mx-auto px-4 pb-24 md:pb-32">
        {/* The central timeline line container */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-white/[0.03] -translate-x-1/2 rounded-full" />
        
        {/* The animated growing line */}
        <div 
          ref={lineRef} 
          className="absolute left-4 md:left-1/2 top-0 w-1 bg-violet -translate-x-1/2 rounded-full shadow-[0_0_15px_rgba(90,70,218,0.5)]" 
        />

        <div className="space-y-16 md:space-y-24 mt-10">
          {features.map((f, i) => {
            const isLeft = i % 2 === 0;
            return (
              <div 
                key={i} 
                ref={(el) => (itemsRef.current[i] = el)}
                className="relative flex items-center md:justify-between flex-col md:flex-row pl-12 md:pl-0 w-full"
              >
                {/* Timeline Icon Node */}
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full bg-[#0c0c20] border-4 border-violet text-violet z-10 shadow-lg shadow-violet/20">
                  {f.icon}
                </div>

                {/* Content Side (Desktop) */}
                <div className={`hidden md:block w-[45%] ${isLeft ? 'md:text-right pr-8' : 'md:ml-auto pl-8'}`}>
                  <div className="group bg-white/[0.08] backdrop-blur-2xl border border-white/15 rounded-3xl p-8 shadow-[0_12px_40px_rgba(8,8,28,0.45)] hover:bg-white/[0.1] hover:border-violet/35 transition-all duration-500">
                    <div className={`text-5xl font-black text-white/5 absolute ${isLeft ? 'right-6' : 'left-6'} top-6 transition-all group-hover:text-violet/10 group-hover:scale-110 pointer-events-none`}>
                      {(i + 1).toString().padStart(2, '0')}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4 relative z-10">
                      {f.title}
                    </h3>
                    <p className="text-white/55 leading-relaxed relative z-10">
                      {f.description}
                    </p>
                  </div>
                </div>

                {/* Content Side (Mobile - always right) */}
                <div className="md:hidden w-full">
                  <div className="group bg-white/[0.08] backdrop-blur-2xl border border-white/15 rounded-2xl p-6 shadow-[0_10px_28px_rgba(8,8,28,0.45)] hover:bg-white/[0.1] hover:border-violet/35 transition-all duration-500">
                    <div className="text-4xl font-black text-white/5 absolute right-4 top-4 transition-all group-hover:text-violet/10 pointer-events-none">
                      {(i + 1).toString().padStart(2, '0')}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 relative z-10">
                      {f.title}
                    </h3>
                    <p className="text-white/55 text-sm leading-relaxed relative z-10">
                      {f.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Features;
