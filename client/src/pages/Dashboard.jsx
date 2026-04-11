import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';

const statsCards = [
  { title: 'Interviews Practiced', value: '24', subtext: '+3 this week', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg> },
  { title: 'Resume Score', value: '87%', subtext: 'ATS Compatible', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
  { title: 'Applications Sent', value: '12', subtext: '5 pending review', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg> },
  { title: 'Upcoming Tasks', value: '5', subtext: '2 due today', icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg> },
];

const quickActions = [
  { label: 'Start Interview', path: '/dashboard/interview-prep' },
  { label: 'Generate Resume', path: '/dashboard/resume-generator' },
  { label: 'Check ATS Score', path: '/dashboard/ats-checker' },
  { label: 'Find Internships', path: '/dashboard/internship-finder' },
];

const recentActivity = [
  { text: 'Completed Resume Interview — scored 78%', time: '2 hours ago' },
  { text: 'Updated resume — added new project', time: '5 hours ago' },
  { text: 'Applied to Google — SDE Intern', time: '1 day ago' },
  { text: 'Completed DSA Interview — 5/5 questions', time: '2 days ago' },
  { text: 'Applied to Microsoft — Software Engineer', time: '3 days ago' },
];

function Dashboard() {
  const navigate = useNavigate();
  const cardsRef = useRef([]);
  const containerRef = useRef(null);
  
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(cardsRef.current.filter(Boolean), { opacity: 0, y: 30, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-6">
      {/* Greeting */}
      <div ref={(el) => (cardsRef.current[0] = el)}>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
          Welcome back, <span className="text-violet">{userName}</span> 👋
        </h2>
        <p className="text-white/50 text-sm">Here's what's happening with your interview prep journey.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((c, i) => (
          <div key={i} ref={(el) => (cardsRef.current[i + 1] = el)}>
            <GlassCard className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-violet/15 flex items-center justify-center text-violet group-hover:bg-violet group-hover:text-white shadow-lg shadow-transparent group-hover:shadow-violet/20 transition-all duration-300">
                  {c.icon}
                </div>
              </div>
              <p className="text-white/50 text-sm font-medium">{c.title}</p>
              <p className="text-3xl font-bold text-white mt-1">{c.value}</p>
              <p className="text-xs text-white/35 mt-1">{c.subtext}</p>
            </GlassCard>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div ref={(el) => (cardsRef.current[5] = el)}>
        <h3 className="text-lg font-semibold text-white mb-3">Quick Actions</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <button key={i} onClick={() => navigate(a.path)} className="group relative overflow-hidden rounded-2xl p-4 bg-violet text-white font-semibold text-sm shadow-lg shadow-violet/20 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet/30 transition-all duration-300 text-left">
              <span className="relative z-10">{a.label}</span>
              <span className="relative z-10 block text-xs text-white/60 mt-1">→ Get started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div ref={(el) => (cardsRef.current[6] = el)}>
        <h3 className="text-lg font-semibold text-white mb-3">Recent Activity</h3>
        <GlassCard padding="p-0" hover={false}>
          {recentActivity.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-2 h-2 rounded-full bg-violet shrink-0" />
              <p className="text-sm text-white/55 flex-1">{item.text}</p>
              <span className="text-xs text-white/30 shrink-0">{item.time}</span>
            </div>
          ))}
        </GlassCard>
      </div>
    </div>
  );
}

export default Dashboard;
