import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

function About() {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(leftRef.current, { opacity: 0, x: -60 }, {
        opacity: 1, x: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
      gsap.fromTo(rightRef.current, { opacity: 0, x: 60 }, {
        opacity: 1, x: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative py-24 md:py-32 px-4">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-muted">About Us</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
          Who We <span className="text-violet">Are</span>
        </h2>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div ref={leftRef}>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 leading-snug">
              Building the future of <span className="text-violet">interview preparation</span>
            </h3>
            <p className="text-white/60 leading-relaxed mb-6">
              Nexa AI is an intelligent mock interview platform designed to help
              candidates practice and refine their interview skills using advanced AI.
            </p>
            <p className="text-white/60 leading-relaxed">
              Our mission is to democratize interview preparation — giving everyone
              access to personalized, high-quality coaching.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { value: '10K+', label: 'Users' },
                { value: '50K+', label: 'Interviews' },
                { value: '95%', label: 'Satisfaction' },
              ].map((s) => (
                <div key={s.label} className="text-center p-4">
                  <div className="text-2xl font-bold text-violet">{s.value}</div>
                  <div className="text-xs text-white/45 mt-1 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div ref={rightRef} className="flex items-center justify-center">
            <div className="relative w-full max-w-md aspect-square">
              <div className="absolute inset-0 rounded-3xl bg-violet/5 border border-violet/10 animate-pulse" />
              <div className="absolute inset-4 rounded-3xl bg-surface/30 border border-violet/8" />
              <div className="absolute inset-8 rounded-3xl bg-surface/40 border border-violet/10 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-violet flex items-center justify-center shadow-2xl shadow-violet/30">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-lg">AI Interview Engine</p>
                  <p className="text-white/45 text-sm mt-2">Powered by Gemini</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
