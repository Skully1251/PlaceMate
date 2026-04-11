import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

function Contact() {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(leftRef.current, { opacity: 0, x: -50 }, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
      gsap.fromTo(rightRef.current, { opacity: 0, x: 50 }, {
        opacity: 1, x: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent!');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" ref={sectionRef} className="relative py-24 md:py-32 px-4">
      <div className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-[0.2em] uppercase text-muted">Get In Touch</span>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
          Contact <span className="text-violet">Us</span>
        </h2>
      </div>
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16">
          <div ref={leftRef} className="flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">Let's start a conversation</h3>
            <p className="text-white/55 leading-relaxed mb-8">Have questions about Nexa AI? We'd love to hear from you.</p>
            <div className="flex items-center gap-4 mb-6 group">
              <div className="w-12 h-12 rounded-xl bg-violet/15 flex items-center justify-center text-violet group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              </div>
              <div>
                <p className="text-white/45 text-sm">Email us at</p>
                <a href="mailto:hello@nexa-ai.com" className="text-white font-medium hover:text-violet transition-colors">placemate@gmail.com</a>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-violet/10 flex items-center justify-center text-violet group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              </div>
              <div>
                <p className="text-white/45 text-sm">Based in</p>
                <p className="text-white font-medium">India</p>
              </div>
            </div>
          </div>
          <div ref={rightRef}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2">Your Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-violet/30 focus:bg-white/[0.06] transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2">Your Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-violet/30 focus:bg-white/[0.06] transition-all" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/50 mb-2">Message</label>
                <textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Tell us what you need..." rows={4} className="w-full px-5 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/25 focus:outline-none focus:border-violet/30 focus:bg-white/[0.06] transition-all resize-none" required />
              </div>
              <button type="submit" className="w-full py-4 text-sm font-bold text-white bg-violet rounded-xl shadow-lg shadow-violet/25 hover:bg-violet/90 hover:shadow-violet/40 hover:scale-[1.02] transition-all duration-300">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
