import React, { useState, useRef, useEffect } from 'react';

function Topbar({ title, onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
  const userInitial = userName.charAt(0).toUpperCase();

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/[0.07] backdrop-blur-3xl border-b border-white/15 shadow-[0_8px_30px_rgba(7,8,20,0.38)] flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 text-white/50 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>
        <h1 className="text-lg font-bold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className={`relative transition-all duration-300 ${searchOpen ? 'w-48 md:w-64' : 'w-auto'}`}>
          {searchOpen ? (
            <input
              type="text"
              placeholder="Search..."
              autoFocus
              className="w-full px-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-violet/30"
              onBlur={() => setSearchOpen(false)}
            />
          ) : (
            <button onClick={() => setSearchOpen(true)} className="p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
            </button>
          )}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-white/40 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet rounded-full" />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 hover:bg-white/[0.06] rounded-xl transition-all">
            <div className="hidden md:flex flex-col text-right mr-1">
              <span className="text-sm font-semibold text-white/90 leading-tight">{userName}</span>
              <span className="text-xs text-white/50 leading-tight">{userEmail}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-violet flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet/20">{userInitial}</div>
            <svg className={`w-4 h-4 text-white/40 hidden lg:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#0c0c20]/98 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-4 md:hidden">
                <p className="text-sm font-semibold text-white">{userName}</p>
                <p className="text-xs text-white/45">{userEmail}</p>
              </div>
              <div className="py-2">
                <button className="w-full px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/[0.06] text-left transition-all">Profile</button>
                <button className="w-full px-4 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/[0.06] text-left transition-all">Settings</button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userEmail');
                    window.location.href = '/';
                  }}
                  className="w-full px-4 py-2.5 text-sm text-red-400/60 hover:text-red-400 hover:bg-red-900/5 text-left transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
