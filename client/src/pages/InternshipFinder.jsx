import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap'; import GlassCard from '../components/dashboard/GlassCard'; import Button from '../components/dashboard/Button'; import Input from '../components/dashboard/Input';
const mockInternships = [
  { company: 'Google', role: 'Software Engineering Intern', location: 'Bangalore, India', type: 'Hybrid', logo: 'G' },
  { company: 'Microsoft', role: 'SDE Intern', location: 'Hyderabad, India', type: 'On-site', logo: 'M' },
  { company: 'Amazon', role: 'Backend Developer Intern', location: 'Remote', type: 'Remote', logo: 'A' },
  { company: 'Flipkart', role: 'Full Stack Intern', location: 'Bangalore, India', type: 'Hybrid', logo: 'F' },
  { company: 'Razorpay', role: 'Frontend Developer Intern', location: 'Remote', type: 'Remote', logo: 'R' },
  { company: 'Zomato', role: 'ML Engineering Intern', location: 'Gurugram, India', type: 'On-site', logo: 'Z' },
];
function InternshipFinder() {
  const [search, setSearch] = useState(''); const [roleFilter, setRoleFilter] = useState(''); const [locationFilter, setLocationFilter] = useState(''); const [remoteOnly, setRemoteOnly] = useState(false); const containerRef = useRef(null);
  useEffect(() => { gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }); }, []);
  const filtered = mockInternships.filter(i => { const ms = !search || i.company.toLowerCase().includes(search.toLowerCase()) || i.role.toLowerCase().includes(search.toLowerCase()); const mr = !roleFilter || i.role.toLowerCase().includes(roleFilter.toLowerCase()); const ml = !locationFilter || i.location.toLowerCase().includes(locationFilter.toLowerCase()); const mrem = !remoteOnly || i.type === 'Remote'; return ms && mr && ml && mrem; });
  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-white mb-1">Internship Finder</h2><p className="text-white/50 text-sm">Discover internships matched to your skills</p></div>
      <GlassCard hover={false}><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input placeholder="Search companies or roles..." value={search} onChange={e => setSearch(e.target.value)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>} />
        <Input placeholder="Filter by role..." value={roleFilter} onChange={e => setRoleFilter(e.target.value)} /><Input placeholder="Filter by location..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} />
        <label className="flex items-center gap-3 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-sm text-white/55 cursor-pointer hover:bg-white/[0.07] transition-all"><input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} className="w-4 h-4 rounded bg-dark border-white/20 text-violet focus:ring-violet/20" />Remote Only</label>
      </div></GlassCard>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((n, i) => (
        <GlassCard key={i} className="group flex flex-col"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-violet/15 flex items-center justify-center text-violet font-bold text-sm group-hover:bg-violet group-hover:text-white transition-all">{n.logo}</div><div><p className="text-white font-semibold text-sm">{n.company}</p><span className={`text-xs px-2 py-0.5 rounded-full ${n.type === 'Remote' ? 'bg-violet/10 text-violet border border-violet/15' : n.type === 'Hybrid' ? 'bg-white/[0.05] text-white/60 border border-white/8' : 'bg-white/[0.04] text-white/50 border border-white/6'}`}>{n.type}</span></div></div>
          <h3 className="text-base font-semibold text-white mb-1">{n.role}</h3><p className="text-xs text-white/40 mb-4 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>{n.location}</p>
          <div className="mt-auto"><Button variant="secondary" fullWidth className="text-xs">Apply Now →</Button></div></GlassCard>))}</div>
      {filtered.length === 0 && <div className="text-center py-16"><p className="text-white/35 text-sm">No internships found matching your criteria</p></div>}
    </div>
  );
}
export default InternshipFinder;
