import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; import gsap from 'gsap';
const navLinks = [{ label: 'Home', href: '#hero' }, { label: 'About', href: '#about' }, { label: 'Features', href: '#features' }, { label: 'Why Choose Us', href: '#why-choose-us' }];
function Navbar() {
  const [scrolled, setScrolled] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null); const mobileMenuRef = useRef(null); const navigate = useNavigate();
  useEffect(() => { const h = () => setScrolled(window.scrollY > 40); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
  useEffect(() => { if (mobileMenuRef.current) { if (mobileOpen) gsap.fromTo(mobileMenuRef.current, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.4, ease: 'power3.out' }); else gsap.to(mobileMenuRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power3.in' }); } }, [mobileOpen]);
  const handleNavClick = (e, href) => { e.preventDefault(); setMobileOpen(false); document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' }); };
  return (
    <nav ref={navRef} className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <a href="#hero" onClick={e => handleNavClick(e, '#hero')} className="flex items-center gap-2 group z-10">
            <div className="w-9 h-9 rounded-xl bg-violet flex items-center justify-center shadow-lg shadow-violet/25 group-hover:shadow-violet/40 transition-shadow"><span className="text-white font-black text-sm">P</span></div>
            <span className="text-xl font-black tracking-wider text-white">PlaceMate</span>
          </a>
          <div className="hidden md:flex items-center">
            <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full border transition-all duration-500 ${scrolled ? 'bg-dark/80 backdrop-blur-xl border-violet/15 shadow-2xl' : 'bg-white/5 backdrop-blur-md border-white/8'}`}>
              {navLinks.map(link => (<a key={link.href} href={link.href} onClick={e => handleNavClick(e, link.href)} className="relative px-4 py-2 text-sm font-medium text-white/50 hover:text-white hover:bg-violet/10 rounded-full transition-all duration-300">{link.label}</a>))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 z-10">
            <button onClick={() => navigate('/login')} className="px-5 py-2 text-sm font-semibold text-white/60 border border-white/10 rounded-full hover:bg-white/5 hover:border-violet/20 hover:text-white transition-all duration-300">Login</button>
            <button onClick={() => navigate('/signup')} className="px-5 py-2 text-sm font-semibold text-white bg-violet rounded-full shadow-lg shadow-violet/30 hover:bg-violet/90 hover:shadow-violet/50 hover:scale-105 transition-all duration-300">Sign Up</button>
          </div>
          <button className="md:hidden flex flex-col gap-[5px] p-2 z-10" onClick={() => setMobileOpen(!mobileOpen)}>
            <span className={`block w-6 h-[2px] bg-white/70 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
            <span className={`block w-6 h-[2px] bg-white/70 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-[2px] bg-white/70 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
          </button>
        </div>
      </div>
      <div ref={mobileMenuRef} className="md:hidden overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <div className="mx-4 mt-3 px-4 pb-6 pt-4 space-y-1 bg-dark/90 backdrop-blur-xl border border-violet/15 rounded-2xl shadow-xl">
          {navLinks.map(link => (<a key={link.href} href={link.href} onClick={e => handleNavClick(e, link.href)} className="block px-4 py-3 text-sm font-medium text-white/50 hover:text-white hover:bg-violet/10 rounded-xl transition-all">{link.label}</a>))}
          <div className="flex gap-3 pt-4 px-4">
            <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="flex-1 py-2.5 text-sm font-semibold text-white/60 border border-white/10 rounded-full hover:bg-white/5 transition-all">Login</button>
            <button onClick={() => { setMobileOpen(false); navigate('/signup'); }} className="flex-1 py-2.5 text-sm font-semibold text-white bg-violet rounded-full shadow-lg transition-all">Sign Up</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
