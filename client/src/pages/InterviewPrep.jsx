import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';
import Button from '../components/dashboard/Button';
import * as pdfjsLib from 'pdfjs-dist';
import ResumeInterview from '../components/dashboard/ResumeInterview';
import DSAInterview from '../components/dashboard/DSAInterview';
import HRInterview from '../components/dashboard/HRInterview';
import CombinedInterview from '../components/dashboard/CombinedInterview';
import { getRandomQuestionCount } from '../utils/questionEngine.js';
import api from '../utils/api.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const tabs = [
  { id: 'resume', label: 'Resume Interview' },
  { id: 'dsa', label: 'DSA Interview' },
  { id: 'hr', label: 'HR Interview' },
  { id: 'combined', label: 'Combined Interview' }
];

const jobRoles = ["Software Engineer", "Product Manager", "Data Scientist", "UX/UI Designer", "Marketing Manager", "DevOps Engineer"];

// Subcomponent for handling the detailed Combined Interview Report
function CombinedReport({ results }) {
  const [expandedRound, setExpandedRound] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);

  const roundsConfig = [
      { id: 'resume', title: 'Resume Round', icon: '📄', color: 'text-violet' },
      { id: 'dsa', title: 'DSA Round', icon: '💻', color: 'text-blue-400' },
      { id: 'behavioral', title: 'Behavioral Round', icon: '🤝', color: 'text-green-400' }
  ];

  return (
      <div className="w-full max-w-4xl mx-auto print:max-w-full">
          <div className="flex justify-between items-center mb-6 print:hidden">
              <h2 className="text-2xl font-bold text-white">Full Loop Results</h2>
              <Button onClick={() => window.print()} className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-2 rounded-xl text-white font-bold shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                 Download Report
              </Button>
          </div>

          <GlassCard className="p-8 md:p-12 border-white/10 shadow-2xl print:shadow-none print:border-none print:bg-white print:text-black print:p-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-violet/10 blur-[120px] rounded-full pointer-events-none print:hidden"></div>
              
              {/* Header */}
              <div className="text-center mb-12 border-b border-white/10 pb-8 print:border-black/10">
                  <h1 className="text-4xl font-extrabold text-white mb-6 print:text-black tracking-tight cursor-default">Career Assessment Profile</h1>
                  <div className="inline-flex flex-col items-center justify-center p-8 rounded-full border-2 border-violet/20 bg-white/[0.02] print:border-black/20 print:bg-transparent cursor-default transition-transform hover:scale-105">
                      <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet to-indigo-400 print:text-black">
                          {results.overallScore}
                      </span>
                      <span className="text-white/50 text-sm font-bold uppercase tracking-widest mt-2 print:text-black/60">Overall Score</span>
                  </div>
                  <p className="mt-8 text-lg text-white/80 max-w-2xl mx-auto font-medium print:text-black">{results.finalVerdict}</p>
              </div>

              {/* Rounds Breakdown */}
              <div className="space-y-4 mb-10">
                  <h3 className="text-xl font-bold text-white mb-6 print:text-black cursor-default">Round Analysis</h3>
                  {roundsConfig.map(round => {
                      const roundData = results.rounds[round.id];
                      if (!roundData) return null;
                      
                      const isOpen = expandedRound === round.id;

                      return (
                          <div key={round.id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden print:border-black/20 print:bg-transparent">
                              {/* Accordion Target */}
                              <button 
                                  onClick={() => setExpandedRound(isOpen ? null : round.id)}
                                  className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors print:hidden"
                              >
                                  <div className="flex items-center gap-4">
                                      <span className="text-3xl">{round.icon}</span>
                                      <h4 className={`text-xl font-bold ${round.color}`}>{round.title}</h4>
                                  </div>
                                  <div className="flex items-center gap-4">
                                      <span className="text-2xl font-black text-white">{roundData.roundScore} <span className="text-sm font-medium text-white/40">/ 100</span></span>
                                      <svg className={`w-5 h-5 text-white/50 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </div>
                              </button>
                              
                              {/* Print visible simple header */}
                              <div className="hidden print:flex items-center justify-between p-4 border-b border-black/10 bg-gray-50">
                                  <h4 className="text-lg font-bold text-black">{round.title}</h4>
                                  <span className="font-bold text-black">Score: {roundData.roundScore}/100</span>
                              </div>

                              {/* Details */}
                              <div className={`px-6 pb-6 print:block ${isOpen ? 'block' : 'hidden'}`}>
                                  <div className="space-y-6 pt-4 border-t border-white/5 print:border-none">
                                      {roundData.questions?.map((q, idx) => (
                                          <div key={idx} className="bg-black/20 p-5 rounded-xl print:bg-white print:border print:border-black/10">
                                              <p className="font-bold text-white mb-3 print:text-black">Q: {q.question}</p>
                                              <div className="pl-4 border-l-2 border-violet/30 mb-4 print:border-black/30">
                                                  <p className="text-sm text-white/70 italic print:text-black/70">"{q.answer || q.explanation}"</p>
                                              </div>
                                              {q.code && q.code !== 'pass' && !q.code.includes('public boolean problem()') && (
                                                  <pre className="bg-black text-green-400 p-4 rounded-lg text-xs overflow-x-auto mb-4 print:bg-gray-100 print:text-black print:border print:border-black/10">
                                                      {q.code}
                                                  </pre>
                                              )}
                                              <div className="flex items-center justify-between mt-4 bg-white/[0.02] p-3 rounded-lg print:bg-transparent">
                                                  <p className="text-sm text-white/90 print:text-black"><span className="text-violet font-semibold">Feedback:</span> {q.feedback}</p>
                                                  <span className="text-sm font-bold text-white print:text-black px-3 py-1 bg-white/5 rounded-full print:bg-gray-200">Score: {q.score}</span>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>

              {/* Strengths / Weaknesses Interactive Cards */}
              <div className="grid md:grid-cols-2 gap-6 print:block print:space-y-6">
                  {/* Strengths */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden print:border-black/20 print:bg-transparent">
                      <button onClick={() => setExpandedCard(expandedCard === 'strengths' ? null : 'strengths')} className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors print:pointer-events-none">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-500/20 rounded-xl"><svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                              <h3 className="text-lg font-bold text-white print:text-black">Core Strengths</h3>
                          </div>
                           <svg className={`w-5 h-5 text-white/50 print:hidden transform transition-transform ${expandedCard === 'strengths' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <div className={`px-6 pb-6 print:block ${expandedCard === 'strengths' ? 'block' : 'hidden'}`}>
                           <ul className="space-y-3 pt-4 border-t border-white/5 print:border-black/10">
                              {(results.strengths || []).map((s, i) => <li key={i} className="flex items-start gap-3 text-white/80 text-sm print:text-black"><span className="text-green-400 mt-0.5 font-bold">✓</span> {s}</li>)}
                          </ul>
                      </div>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden print:border-black/20 print:bg-transparent">
                      <button onClick={() => setExpandedCard(expandedCard === 'weaknesses' ? null : 'weaknesses')} className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors print:pointer-events-none">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-red-500/20 rounded-xl"><svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                              <h3 className="text-lg font-bold text-white print:text-black">Areas for Improvement</h3>
                          </div>
                           <svg className={`w-5 h-5 text-white/50 print:hidden transform transition-transform ${expandedCard === 'weaknesses' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      <div className={`px-6 pb-6 print:block ${expandedCard === 'weaknesses' ? 'block' : 'hidden'}`}>
                           <ul className="space-y-3 pt-4 border-t border-white/5 print:border-black/10">
                              {(results.weaknesses || []).map((w, i) => <li key={i} className="flex items-start gap-3 text-white/80 text-sm print:text-black"><span className="text-red-400 mt-0.5 font-bold">⨯</span> {w}</li>)}
                          </ul>
                      </div>
                  </div>
              </div>
          </GlassCard>
      </div>
  );
}

function InterviewPrep() {
  const [activeTab, setActiveTab] = useState('resume');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [results, setResults] = useState(null);

  // Resume Setup State
  const [resumeFile, setResumeFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [initialHistory, setInitialHistory] = useState([]);

  const containerRef = useRef(null);

  useEffect(() => { 
    gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }); 
  }, [activeTab]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setResumeFile(file);
      setFileName(file.name);
      setIsParsing(true);
      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const typedarray = new Uint8Array(event.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let text = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ');
          }
          setResumeText(text);
          setIsParsing(false);
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error(err);
        setIsParsing(false);
      }
    }
  };

  const startResumeInterview = () => {
    const questionCount = getRandomQuestionCount();
    const introMessage = `Hello! I'm Nexa, and I'll be conducting your mock interview today for the ${jobRole} position. I've reviewed your resume. I will ask you ${questionCount} questions to understand your experience better. Let's begin when you're ready.`;
    
    const systemPrompt = `You are an expert technical interviewer and career coach named 'Nexa'. Your task is to conduct a mock interview for the role of '${jobRole}'.
**You MUST conduct the entire interview, including all questions and feedback, in English.**
The candidate's resume is provided below:
--- START RESUME ---
${resumeText}
--- END RESUME ---
Here are your instructions:
1.  **Language & Script**: The primary language for this session is English.
2.  **Formatting**: Your responses MUST be plain text only. Do not use any markdown formatting, especially asterisks (*), bolding, or lists.
3.  **Goal**: Assess the candidate's skills, experience, and suitability for the role and cross question skills they mention in their resume. Ask a total of ${questionCount} main questions.
4.  **Persona**: Maintain a professional, encouraging, and conversational tone. You have already introduced yourself; your first response should be the first question.
5.  **Questioning Flow**: Ask ONE question at a time and wait for the candidate's response.
6.  **Adaptive Response Analysis**:
    -   If the candidate's answer is strong and detailed: Give brief, positive reinforcement then move to the next question.
    -   If the candidate's answer is weak or vague: Ask a clarifying follow-up question.
7.  **Conclusion**: After the ${questionCount}th question, provide a brief concluding remark, thank the candidate, and tell them they can now access their feedback.
8.  **Final Feedback Generation**: After the interview concludes, you will receive a final prompt. Your response to this MUST be ONLY a single JSON object with the keys 'strengths', 'weaknesses', 'advice', and 'score'.`;

    setInitialHistory([
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: introMessage }] },
    ]);
    setInterviewStarted(true);
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setResults(null);
    setResumeFile(null);
    setFileName('');
    setResumeText('');
  };

  // Save interview results to backend and update local state
  const handleInterviewComplete = (interviewResults) => {
    setResults(interviewResults);

    // Persist to database (fire-and-forget)
    const savePayload = {
      type: activeTab,
      score: interviewResults.score || interviewResults.overallScore || 0,
      strengths: interviewResults.strengths || [],
      weaknesses: interviewResults.weaknesses || [],
      advice: interviewResults.advice || [],
    };

    // For combined interviews, also save round data and use overallScore
    if (interviewResults.overallScore) {
      savePayload.overallScore = interviewResults.overallScore;
    }
    if (interviewResults.rounds) {
      savePayload.rounds = interviewResults.rounds;
    }

    api.post('/api/interview/save-result', savePayload)
      .then(() => console.log('Interview result saved to database.'))
      .catch((err) => console.error('Failed to save interview result:', err));
  };

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6 pb-20 print:p-0 print:m-0 print:max-w-full">
      
      {/* Hide headers and tabs entirely when print is invoked */}
      <div className="print:hidden">
        {/* Only hide tabs if interview is actively running */}
        {!interviewStarted && (
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Interview Prep</h2>
            <p className="text-white/50 text-sm mb-6">Practice with interactive Voice AI-powered mock interviews</p>

            <div className="flex flex-wrap gap-2 p-1.5 bg-white/[0.04] border border-white/10 rounded-2xl w-fit backdrop-blur-xl">
              {tabs.map((t) => (
                <button 
                  key={t.id} 
                  onClick={() => { setActiveTab(t.id); resetInterview(); }} 
                  className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === t.id ? 'bg-violet shadow-[0_0_15px_rgba(90,70,218,0.4)] text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.06]'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Render Results if done */}
      {results ? (
        results.rounds ? (
           <CombinedReport results={results} />
        ) : (
          <div className="animate-fade-in w-full max-w-4xl mx-auto print:hidden">
            <GlassCard className="p-8 md:p-12 border-violet/30 shadow-[0_0_30px_rgba(90,70,218,0.15)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-white mb-4">Interview Complete</h2>
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-violet/30 mb-4 bg-white/[0.02]">
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-violet to-indigo-400">
                            {results.score || results.overallScore || 0}
                        </span>
                    </div>
                    <p className="text-white/60 font-medium">Overall Score</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-10">
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-green-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-500/20 rounded-xl"><svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                            <h3 className="text-lg font-bold text-white">Strengths</h3>
                        </div>
                        <ul className="space-y-3">
                            {(results.strengths || []).map((s, i) => <li key={i} className="flex items-start gap-2 text-white/70 text-sm"><span className="text-green-400 mt-0.5">•</span> {s}</li>)}
                        </ul>
                    </div>
                    
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 hover:border-red-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-500/20 rounded-xl"><svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
                            <h3 className="text-lg font-bold text-white">Areas for Improvement</h3>
                        </div>
                        <ul className="space-y-3">
                            {(results.weaknesses || []).map((w, i) => <li key={i} className="flex items-start gap-2 text-white/70 text-sm"><span className="text-red-400 mt-0.5">•</span> {w}</li>)}
                        </ul>
                    </div>
                </div>

                {results.advice && results.advice.length > 0 && (
                    <div className="bg-violet/10 border border-violet/20 rounded-2xl p-6 mb-10">
                        <h3 className="text-lg font-bold text-white mb-4">Actionable Advice</h3>
                        <ul className="space-y-3">
                            {results.advice.map((a, i) => <li key={i} className="text-white/80 text-sm flex items-start gap-2"><span className="text-violet mt-0.5">→</span> {a}</li>)}
                        </ul>
                    </div>
                )}

                <div className="flex justify-center print:hidden">
                    <Button onClick={resetInterview} className="px-8 py-3 text-sm font-semibold rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white transition-all">Start New Interview</Button>
                </div>
            </GlassCard>
          </div>
        )
      ) : (
        <div className="print:hidden">
          {/* RESUME INTERVIEW SETUP */}
          {activeTab === 'resume' && !interviewStarted && (
            <GlassCard className="text-center py-16 px-8 max-w-2xl mx-auto border-white/10 shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-violet/20 flex items-center justify-center border border-violet/30 shadow-[0_0_20px_rgba(90,70,218,0.2)]">
                <svg className="w-10 h-10 text-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Resume Voice Interview</h3>
              <p className="text-white/50 mb-10 text-sm">Upload your resume. Nexa AI will analyze it and ask targeted questions via voice.</p>
              
              <div className="space-y-6 mb-8 text-left max-w-md mx-auto">
                 <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">1. Attach Resume</label>
                    <label className={`block cursor-pointer p-6 bg-white/[0.02] border border-white/10 hover:border-violet/40 rounded-xl transition-all flex flex-col items-center gap-4 text-center group ${isParsing ? 'opacity-50 pointer-events-none' : ''}`}>
                       {fileName ? (
                           <div className="text-green-400 font-medium break-all">{fileName}</div>
                       ) : (
                           <>
                             <svg className="w-8 h-8 text-white/30 group-hover:text-violet transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                             <span className="block text-sm font-semibold text-white/80 uppercase tracking-wider group-hover:text-white transition-colors">Choose PDF</span>
                             <p className="text-xs text-white/40">No file chosen</p>
                           </>
                       )}
                       <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
                    </label>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">2. Select Job Role</label>
                    <select value={jobRole} onChange={(e) => setJobRole(e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-4 text-sm text-white/90 focus:ring-2 focus:ring-violet focus:outline-none appearance-none">
                       {jobRoles.map(role => <option key={role} value={role} className="text-black bg-white">{role}</option>)}
                    </select>
                 </div>
              </div>

              <button onClick={startResumeInterview} disabled={!resumeText || isParsing} className="w-full max-w-md bg-gradient-to-r from-violet to-indigo-500 hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(90,70,218,0.4)] disabled:opacity-50 disabled:shadow-none transition-all">
                {isParsing ? 'Reading PDF...' : 'Start Your Interview →'}
              </button>
            </GlassCard>
          )}

          {/* ACTIVE RESUME INTERVIEW */}
          {activeTab === 'resume' && interviewStarted && (
            <div className="animate-fade-in">
                <Button variant="secondary" onClick={resetInterview} className="mb-4">← Abort Validation</Button>
                <GlassCard className="p-8 border-violet/20 shadow-[0_0_20px_rgba(90,70,218,0.1)]">
                    <ResumeInterview initialHistory={initialHistory} language="en-US" onEndInterview={handleInterviewComplete} />
                </GlassCard>
            </div>
          )}

          {/* DSA INTERVIEW */}
          {activeTab === 'dsa' && (
             <div className="animate-fade-in w-full">
                 {!interviewStarted && (
                     <div className="mb-4 flex items-center justify-between">
                         <div>
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">DSA Interview</h2>
                            <p className="text-white/50 text-sm">Interactive coding challenges with voice-based approach explanation.</p>
                         </div>
                     </div>
                 )}
                 <DSAInterview onStart={() => setInterviewStarted(true)} onEndInterview={handleInterviewComplete} />
             </div>
          )}

          {/* HR INTERVIEW */}
          {activeTab === 'hr' && !interviewStarted && (
            <GlassCard className="text-center py-20 px-8 max-w-xl mx-auto border-white/10 shadow-2xl">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5V4a2 2 0 00-2-2H4a2 2 0 00-2 2v16h5m8 0v-2a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0h-8" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Behavioral HR Interview</h3>
              <p className="text-white/60 mb-10 text-sm max-w-sm mx-auto">Nexa AI will evaluate your soft skills, teamwork, and cultural fit through 4-6 randomly selected Behavioral scenarios.</p>
              
              <button onClick={() => setInterviewStarted(true)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all">
                Start Interview Now →
              </button>
            </GlassCard>
          )}

          {activeTab === 'hr' && interviewStarted && (
            <div className="animate-fade-in">
                <Button variant="secondary" onClick={resetInterview} className="mb-4">← Abort Interview</Button>
                <HRInterview language="en-US" onEndInterview={handleInterviewComplete} />
            </div>
          )}

          {/* COMBINED INTERVIEW */}
          {activeTab === 'combined' && (
             <div className="animate-fade-in w-full">
                 {!interviewStarted && (
                     <div className="mb-4 flex items-center justify-between">
                         <div>
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Combined Interview Mode</h2>
                            <p className="text-white/50 text-sm">Full loop pipeline: Resume → DSA → Behavioral</p>
                         </div>
                     </div>
                 )}
                 <CombinedInterview onStart={() => setInterviewStarted(true)} onEndInterview={handleInterviewComplete} />
             </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InterviewPrep;
