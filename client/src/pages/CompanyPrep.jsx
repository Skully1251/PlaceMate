import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap'; import GlassCard from '../components/dashboard/GlassCard'; import Input from '../components/dashboard/Input';
const companyData = {
  google: { name: 'Google', logo: 'G', questions: ['Design a URL shortening service', 'Implement LRU Cache from scratch', 'Find the longest substring without repeating characters', 'Design Google Maps — system architecture', 'Explain the CAP theorem with examples'], experiences: [{ author: 'SDE-2 Candidate', text: '4 rounds: 2 coding, 1 system design, 1 behavioral.', rating: 4 }, { author: 'L3 Candidate', text: 'Focus on problem-solving approach. Communication matters.', rating: 5 }], tips: ['Focus on system design for senior roles', 'Practice medium-hard LeetCode', 'Prepare STAR format for behavioral', 'Know Google\'s products', 'Demonstrate Googleyness'] },
  microsoft: { name: 'Microsoft', logo: 'M', questions: ['Reverse a linked list in groups of K', 'Design a file storage system', 'Find all subsets of a given set', 'Explain SOLID principles', 'Improve Microsoft Teams?'], experiences: [{ author: 'SDE Intern', text: '3 rounds of coding on trees, graphs, and DP.', rating: 4 }, { author: 'FTE Candidate', text: 'Structured process. Focus on clean code.', rating: 4 }], tips: ['Strong DS&A emphasis', 'Clean code matters', 'System design for 2+ years', 'Show MS product passion', 'Teamwork questions'] },
  amazon: { name: 'Amazon', logo: 'A', questions: ['Design recommendation engine', 'Priority queue with heap', 'LP: Time you disagreed with coworker', 'Shortest path in weighted graph', 'Scale microservices?'], experiences: [{ author: 'SDE-1 Candidate', text: 'Heavy LP focus. Every behavioral ties to LPs.', rating: 5 }, { author: 'SDE-2 Candidate', text: 'System design was challenging.', rating: 3 }], tips: ['Master 16 Leadership Principles', 'STAR format extensively', 'LeetCode medium', 'Scalability in design', 'Customer obsession'] },
};
function CompanyPrep() {
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState(null); const containerRef = useRef(null);
  useEffect(() => { gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }); }, []);
  const companies = Object.values(companyData).filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const data = selected ? companyData[selected] : null;
  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold text-white mb-1">Company Prep</h2><p className="text-white/50 text-sm">Prepare for interviews at top companies</p></div>
      <Input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>} />
      <div className="grid sm:grid-cols-3 gap-4">{companies.map(c => { const key = c.name.toLowerCase(); return (
        <GlassCard key={key} onClick={() => setSelected(key)} className={`text-center ${selected === key ? 'ring-2 ring-violet/30 bg-violet/5' : ''}`}>
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet/15 flex items-center justify-center text-violet font-bold text-xl">{c.logo}</div>
          <p className="text-white font-semibold">{c.name}</p><p className="text-white/35 text-xs mt-1">{companyData[key].questions.length} questions</p>
        </GlassCard>); })}</div>
      {data && (<div className="space-y-6">
        <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-violet flex items-center justify-center text-white font-bold shadow-lg shadow-violet/25">{data.logo}</div><h3 className="text-xl font-bold text-white">{data.name} — Interview Guide</h3></div>
        <div className="grid lg:grid-cols-2 gap-6">
          <GlassCard hover={false}><h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Interview Questions</h4><div className="space-y-3">{data.questions.map((q, i) => (<div key={i} className="flex items-start gap-3 p-3 bg-white/[0.03] rounded-xl"><span className="text-xs font-bold text-violet bg-violet/10 px-2 py-1 rounded-lg shrink-0">Q{i+1}</span><p className="text-sm text-white/55">{q}</p></div>))}</div></GlassCard>
          <GlassCard hover={false}><h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Preparation Tips</h4><div className="space-y-3 mb-8">{data.tips.map((t, i) => (<div key={i} className="flex items-start gap-3"><span className="w-5 h-5 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5"><svg className="w-3 h-3 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></span><p className="text-sm text-white/50">{t}</p></div>))}</div>
            <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4">Candidate Experiences</h4><div className="space-y-3">{data.experiences.map((e, i) => (<div key={i} className="p-4 bg-white/[0.03] rounded-xl"><div className="flex items-center gap-2 mb-2"><span className="text-xs font-semibold text-violet">{e.author}</span><div className="flex gap-0.5">{Array.from({length:5}).map((_,s)=>(<svg key={s} className={`w-3 h-3 ${s<e.rating?'text-violet':'text-white/15'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>))}</div></div><p className="text-sm text-white/45">{e.text}</p></div>))}</div>
          </GlassCard>
        </div>
      </div>)}
    </div>
  );
}
export default CompanyPrep;
