import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';
import api from '../utils/api.js';

const quickActions = [
  { 
      label: 'Start Interview', 
      path: '/dashboard/interview-prep', 
      motto: 'Sharpen your skills with realistic voice AI loops.',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"/></svg> 
  },
  { 
      label: 'Generate Resume', 
      path: '/dashboard/resume-generator', 
      motto: 'Build a flawlessly ATS-optimized PDF in minutes.',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> 
  },
  { 
      label: 'Check ATS Score', 
      path: '/dashboard/ats-checker', 
      motto: 'Run a deep scan algorithms against job descriptions.',
      icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> 
  },
];

function Dashboard() {
  const navigate = useNavigate();
  const cardsRef = useRef([]);
  const containerRef = useRef(null);
  
  const [activeModal, setActiveModal] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const userName = localStorage.getItem('userName') || 'User';

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/api/dashboard');
        setDashboardData(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
        // Fallback to empty data
        setDashboardData({
          totalInterviews: 0,
          avgScore: 0,
          recentInterviews: [],
          latestATSScore: 0,
          latestATSSuggestions: [],
          totalSolved: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!activeModal && !isLoading) {
      const ctx = gsap.context(() => {
        gsap.fromTo(cardsRef.current.filter(Boolean), 
            { opacity: 0, y: 30, scale: 0.97 }, 
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
        );
      }, containerRef);
      return () => ctx.revert();
    }
  }, [activeModal, isLoading]);
  
  const StatCard = ({ title, value, subtext, icon, onClick, hoverable = false, idx }) => (
      <div ref={(el) => (cardsRef.current[idx] = el)}>
          <GlassCard 
             onClick={onClick} 
             className={`group relative h-full ${hoverable ? 'cursor-pointer hover:border-violet/50 hover:shadow-[0_0_20px_rgba(90,70,218,0.15)] transition-all duration-300' : ''}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-violet/15 flex items-center justify-center text-violet shadow-lg shadow-transparent transition-all duration-300 group-hover:bg-violet group-hover:text-white">
                {icon}
              </div>
              {hoverable && (
                  <svg className="w-5 h-5 text-white/20 group-hover:text-violet transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              )}
            </div>
            <p className="text-white/50 text-sm font-medium">{title}</p>
            <p className="text-4xl font-bold text-white mt-1">{value}</p>
            <p className="text-sm text-white/40 mt-2 font-medium">{subtext}</p>
          </GlassCard>
      </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg className="w-12 h-12 animate-spin text-violet mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const data = dashboardData || {};

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto space-y-10 pb-20 relative">
      
      {/* ── Modals ── */}
      {activeModal === 'interviews' && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
            <div className="relative z-10 w-full max-w-3xl bg-[#0a0614] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[85vh] animate-fade-in border-t-violet/30">
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                   <h3 className="text-2xl font-bold text-white tracking-tight">Interview History Details</h3>
                   <button onClick={() => setActiveModal(null)} className="text-white/50 hover:text-white bg-white/5 rounded-full p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
               </div>
               
               <div className="space-y-4">
                   {(data.recentInterviews || []).length > 0 ? (
                     data.recentInterviews.map((inv, idx) => (
                       <div key={idx} className="bg-white/[0.03] border border-white/5 rounded-2xl p-6">
                           <div className="flex justify-between items-center mb-4">
                               <div>
                                   <span className="text-violet font-bold uppercase tracking-widest text-xs mb-1 block">{inv.type || 'Interview'}</span>
                                   <span className="text-white font-medium">{inv.createdAt ? new Date(inv.createdAt._seconds ? inv.createdAt._seconds * 1000 : inv.createdAt).toLocaleDateString() : 'Recent'}</span>
                               </div>
                               <div className="text-center">
                                   <span className="block text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet to-indigo-400">{inv.score || 0}</span>
                                   <span className="text-xs text-white/50 uppercase font-bold">Score</span>
                               </div>
                           </div>
                       </div>
                     ))
                   ) : (
                     <div className="text-center py-12 text-white/40">
                       <p>No interviews yet. Start your first interview!</p>
                     </div>
                   )}
               </div>
            </div>
         </div>
      )}

      {activeModal === 'resume' && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)} />
            <div className="relative z-10 w-full max-w-2xl bg-[#0a0614] border border-white/10 rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[85vh] animate-fade-in border-t-violet/30">
               <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
                   <h3 className="text-2xl font-bold text-white tracking-tight">Resume ATS Analysis</h3>
                   <button onClick={() => setActiveModal(null)} className="text-white/50 hover:text-white bg-white/5 rounded-full p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
               </div>
               
               <div className="relative w-56 h-56 mx-auto mb-10 flex items-center justify-center rounded-full shadow-[0_0_40px_rgba(90,70,218,0.15)]" 
                    style={{ background: `conic-gradient(#8b5cf6 ${data.latestATSScore || 0}%, #1e1b4b ${data.latestATSScore || 0}%)` }}>
                   <div className="w-48 h-48 bg-[#0a0614] rounded-full flex items-center justify-center flex-col border border-white/5">
                      <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet to-indigo-400">{data.latestATSScore || 0}%</span>
                      <span className="text-xs text-white/50 font-bold uppercase tracking-widest mt-2">Match Rate</span>
                   </div>
               </div>

               {(data.latestATSSuggestions || []).length > 0 && (
                 <div>
                   <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                       <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg> 
                       Suggestions
                   </h4>
                   <ul className="space-y-3">
                       {data.latestATSSuggestions.map((gap, i) => (
                           <li key={i} className="flex gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-white/80 text-sm">
                               <span className="text-red-400 font-bold shrink-0">→</span>
                               {gap}
                           </li>
                       ))}
                   </ul>
                 </div>
               )}
            </div>
         </div>
      )}

      {/* ── Greeting ── */}
      <div ref={(el) => (cardsRef.current[0] = el)} className="pt-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet to-indigo-400">{userName}</span> 👋
        </h2>
        <p className="text-white/60 font-medium">Your interview prep engine awaits.</p>
      </div>

      {/* ── Top 3 Stat Cards ── */}
      <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
         <StatCard 
            idx={1}
            title="Interviews Practiced"
            value={data.totalInterviews || 0}
            subtext="Click to view detailed round histories"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>}
            hoverable={true}
            onClick={() => setActiveModal('interviews')}
         />
         <StatCard 
            idx={2}
            title="Avg. Interview Score"
            value={`${data.avgScore || 0}%`}
            subtext="Click to view ATS analysis"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c0 .621.504 1.125 1.125 1.125H8.25M6.75 21h6.375c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125H6.75c-.621 0-1.125.504-1.125 1.125v5.25c0 .621.504 1.125 1.125 1.125z" /></svg>}
            hoverable={true}
            onClick={() => setActiveModal('resume')}
         />
         <StatCard 
            idx={3}
            title="Questions Solved"
            value={data.totalSolved || 0}
            subtext="Company prep progress"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></svg>}
            hoverable={false}
         />
      </div>

      {/* ── Quick Actions Hero ── */}
      <div ref={(el) => (cardsRef.current[4] = el)} className="pt-8">
        <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">Core Modules</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {quickActions.map((action, i) => (
             <GlassCard key={i} className="group relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:border-violet/40 hover:shadow-[0_0_30px_rgba(90,70,218,0.2)] cursor-pointer" onClick={() => navigate(action.path)}>
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-violet/40 transition-colors"></div>
                
                <div className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white mb-8 group-hover:bg-violet group-hover:text-white transition-all duration-300">
                        {action.icon}
                    </div>
                    
                    <h4 className="text-xl font-bold text-white mb-2">{action.label}</h4>
                    <p className="text-white/50 text-sm font-medium leading-relaxed mb-8">{action.motto}</p>
                    
                    <div className="flex items-center text-violet font-bold text-sm">
                        Launch Engine 
                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </div>
                </div>
             </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Dashboard;
