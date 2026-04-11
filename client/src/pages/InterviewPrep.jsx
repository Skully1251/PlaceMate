import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';
import Button from '../components/dashboard/Button';

const tabs = [{ id: 'resume', label: 'Resume Interview' }, { id: 'dsa', label: 'DSA Interview' }, { id: 'hr', label: 'HR Interview' }];
const mockQuestions = {
  resume: ['Tell me about your most recent project.', 'What technologies did you use and why?', 'Describe a challenge you faced and how you solved it.'],
  dsa: ['Explain the difference between a stack and a queue.', 'How would you find the middle element of a linked list?', 'Describe the time complexity of merge sort.'],
  hr: ['Why do you want to work at this company?', 'Tell me about a time you worked in a team.', 'Where do you see yourself in 5 years?'],
};

function InterviewPrep() {
  const [activeTab, setActiveTab] = useState('resume');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [currentQ, setCurrentQ] = useState(0);
  const containerRef = useRef(null);
  const chatRef = useRef(null);

  useEffect(() => { gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }); }, []);
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [messages]);

  const startInterview = () => { setInterviewStarted(true); setCurrentQ(0); setMessages([{ role: 'ai', text: `Welcome! Let's begin your ${activeTab} interview.\n\n${mockQuestions[activeTab][0]}` }]); };
  const handleSend = () => {
    if (!input.trim()) return;
    const nm = [...messages, { role: 'user', text: input }]; setInput('');
    const nq = currentQ + 1;
    if (nq < mockQuestions[activeTab].length) {
      setTimeout(() => { setMessages([...nm, { role: 'ai', text: `Good answer! Next:\n\n${mockQuestions[activeTab][nq]}` }]); setCurrentQ(nq); }, 800);
    } else {
      setTimeout(() => { setMessages([...nm, { role: 'ai', text: 'Great job! All questions done. 🎉' }]); }, 800);
    }
    setMessages(nm);
  };
  const resetInterview = () => { setInterviewStarted(false); setMessages([]); setCurrentQ(0); setInput(''); };

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Interview Prep</h2>
        <p className="text-white/50 text-sm">Practice with AI-powered mock interviews</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-white/[0.04] border border-white/8 rounded-2xl w-fit">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); if (interviewStarted) resetInterview(); }} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === t.id ? 'bg-violet/15 text-violet' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {!interviewStarted ? (
        <GlassCard className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-violet flex items-center justify-center shadow-2xl shadow-violet/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{activeTab === 'resume' ? 'Resume-Based Interview' : activeTab === 'dsa' ? 'DSA Interview' : 'HR Interview'}</h3>
          <p className="text-white/45 mb-8 max-w-md mx-auto text-sm">{activeTab === 'resume' ? 'AI-generated questions based on your resume.' : activeTab === 'dsa' ? 'Data structures and algorithms challenges.' : 'Behavioral and situational questions.'}</p>
          <Button onClick={startInterview}>Start Interview →</Button>
        </GlassCard>
      ) : (
        <GlassCard padding="p-0" hover={false} className="flex flex-col" style={{ minHeight: '500px' }}>
          <div ref={chatRef} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[500px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-violet/15 text-white border border-violet/10' : 'bg-white/[0.05] text-white/80 border border-white/8'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Type your answer..." className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/10 rounded-xl text-white text-sm placeholder-white/25 focus:outline-none focus:border-violet/30" />
              <Button onClick={handleSend}>Send</Button>
              <Button variant="secondary" onClick={resetInterview}>End</Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default InterviewPrep;
