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
              PlaceMate AI is an intelligent mock interview platform designed to help
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
            <div className="relative w-full max-w-md">
              <div className="absolute -inset-3 rounded-3xl bg-violet/10 blur-2xl pointer-events-none" />
              <img 
                src="/image_hack_proj.jpg" 
                alt="PlaceMate AI Team" 
                className="relative w-full rounded-3xl border border-violet/20 shadow-2xl shadow-violet/10 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
