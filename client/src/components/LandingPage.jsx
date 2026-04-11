import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import About from './landing/About';
import Features from './landing/Features';
import WhyChooseUs from './landing/WhyChooseUs';
import Contact from './landing/Contact';

gsap.registerPlugin(ScrollTrigger);

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timeout);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const handleGetStarted = () => {
    navigate('/dashboard');
  };

  return (
    <div className="relative w-full">
      <Navbar onGetStarted={handleGetStarted} />
      <Hero onGetStarted={handleGetStarted} />
      <About />
      <Features />
      <WhyChooseUs />
      <Contact />
    </div>
  );
}

export default LandingPage;
