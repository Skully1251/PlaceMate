import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';
import Button from '../components/dashboard/Button';
import ReactMarkdown from 'react-markdown';

function ScoreCircle({ score }) {
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    let startTime;
    const duration = 1500; // 1.5 seconds

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeProgress = 1 - Math.pow(1 - percentage, 4);
      const currentVal = Math.round(easeProgress * score);
      
      setCurrentScore(currentVal);
      
      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCurrentScore(score);
      }
    };
    
    // Ensure we start from 0 each time score updates
    setCurrentScore(0);
    requestAnimationFrame(animate);
  }, [score]);

  return (
    <div className="relative w-48 h-48 mx-auto mb-8">
      <svg className="w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
        <circle 
           cx="18" cy="18" r="16" fill="none" stroke="#5A46DA" strokeWidth="3" 
           strokeDasharray={`${currentScore} 100`} strokeLinecap="round" 
           style={{ transition: 'stroke-dasharray 0.05s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold font-sans text-white tracking-tighter">{currentScore}%</span>
        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest mt-1">Match</span>
      </div>
    </div>
  );
}

function ATSChecker() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  }, []);

  const handleAnalyze = () => {
    if (!file || !jd) return;
    setAnalyzed(true);
  };

  const fetchAction = async (action) => {
    if (!file || !jd) return;
    setLoading(true);
    setActiveTab(action);
    setResultData(null);
    try {
      const formData = new FormData();
      formData.append('action', action);
      formData.append('job_description', jd);
      formData.append('resume', file);
      
      const token = localStorage.getItem('firebaseToken');
      const res = await fetch('http://localhost:3001/api/ats/check', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        // The new backend returns { reportId, result: { score, suggestions, ... } }
        const result = data.result;
        if (action === 'score') {
          // Build a formatted string for the existing parser
          const formatted = `Percentage Match: ${result.score}%\n\nKey Missing Keywords: ${(result.missingKeywords || []).join(', ')}\n\nProfile Summary: ${result.profileSummary || result.overallAssessment || ''}`;
          setResultData(formatted);
        } else if (action === 'analysis') {
          let text = `## Overall Assessment\n\n${result.overallAssessment || ''}\n\n`;
          if (result.sectionAnalysis) {
            for (const [section, analysis] of Object.entries(result.sectionAnalysis)) {
              text += `### ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n${analysis}\n\n`;
            }
          }
          if (result.suggestions?.length) {
            text += `## Suggestions\n\n${result.suggestions.map(s => `- ${s}`).join('\n')}`;
          }
          setResultData(text);
        } else if (action === 'gaps') {
          let text = '## Missing Keywords\n\n';
          text += (result.missingKeywords || []).map(k => `- ${k}`).join('\n') + '\n\n';
          text += '## Missing Skills\n\n';
          text += (result.missingSkills || []).map(s => `- ${s}`).join('\n') + '\n\n';
          text += '## Experience Gaps\n\n';
          text += (result.experienceGaps || []).map(g => `- ${g}`).join('\n') + '\n\n';
          text += '## Recommendations\n\n';
          text += (result.recommendations || result.suggestions || []).map(r => `- ${r}`).join('\n');
          setResultData(text);
        }
      } else {
        const err = await res.json();
        setResultData('Error: ' + (err.error || err.detail || 'Failed to analyze resume.'));
      }
    } catch (e) {
      setResultData('Error connecting to backend: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper variable to parse SCORE specifically
  let parsedScore = 0;
  let parsedKeywords = [];
  let parsedSummary = "";
  const isScoreTab = activeTab === 'score' && resultData && !resultData.startsWith('Error');

  if (isScoreTab) {
    const percentageMatch = resultData.match(/Percentage Match.*?(\d+)\s*%/i);
    if (percentageMatch) parsedScore = parseInt(percentageMatch[1], 10);

    const keywordsMatch = resultData.match(/Key Missing Keywords.*?:?\s*(.*?)(?=\n.*Profile Summary|$)/is);
    if (keywordsMatch) {
       parsedKeywords = keywordsMatch[1]
         .replace(/\*/g, '') // remove markdown bold
         .split(/[,\n]/)
         .map(k => k.trim().replace(/^-\s*/, '').replace(/^\d+\.\s*/, '')) // Remove list hyphens or numbers
         .filter(k => k.length > 0 && k.toLowerCase() !== 'none');
    }
    
    const summaryMatch = resultData.match(/Profile Summary.*?:?\s*(.*)/is);
    if (summaryMatch) parsedSummary = summaryMatch[1].replace(/\*/g, '').trim();
  }

  // Pre-configured Tailwind components for styling Markdown
  const MarkdownComponents = {
    p: ({node, ...props}) => <p className="mb-4 leading-relaxed text-white/80" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
    ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
    li: ({node, ...props}) => <li className="text-white/80" {...props} />,
    strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
    h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-white mb-4 mt-6" {...props} />,
    h2: ({node, ...props}) => <h2 className="text-xl font-bold text-white mb-3 mt-5" {...props} />,
    h3: ({node, ...props}) => <h3 className="text-lg font-bold text-white mb-2 mt-4" {...props} />,
    h4: ({node, ...props}) => <h4 className="text-base font-bold text-white/90 mb-2 mt-3" {...props} />,
    code: ({node, inline, ...props}) => inline 
      ? <code className="bg-black/40 px-1.5 py-0.5 rounded text-violet text-sm" {...props} />
      : <pre className="bg-black/40 p-4 rounded-xl text-sm overflow-x-auto mb-4 border border-white/5" {...props} />
  };

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">ATS Checker</h2>
          <p className="text-white/50 text-sm">Analyze your resume for ATS compatibility</p>
        </div>
        {analyzed && (
          <Button variant="secondary" onClick={() => { setAnalyzed(false); setFile(null); setJd(''); setResultData(null); setActiveTab(null); }} className="shrink-0">
             Analyze Another Resume
          </Button>
        )}
      </div>

      {!analyzed ? (
        <GlassCard hover={false} className="max-w-3xl mx-auto">
          <div className="mb-8">
            <label className="block text-sm font-semibold text-white/80 mb-3 uppercase tracking-wider">🎯 Paste Job Description</label>
            <textarea
              placeholder="Copy the job requirements here..."
              value={jd}
              onChange={e => setJd(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all min-h-[150px]"
            />
          </div>

          <div className="text-center py-6 border-t border-white/5 pt-8">
             <label className="block cursor-pointer group">
               <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-white/[0.04] border-2 border-dashed border-white/15 group-hover:border-violet/30 flex items-center justify-center text-white/20 group-hover:text-violet transition-all duration-300">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                 </svg>
               </div>
               <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => setFile(e.target.files[0])} />
             </label>
             {file ? (
               <div className="mb-6">
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-semibold text-green-400">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   {file.name}
                 </div>
               </div>
             ) : (
               <p className="text-white/90 text-sm mb-6 font-medium">Drag and drop your resume, or click to browse<br /><span className="text-white/70 text-xs">PDF supported</span></p>
             )}
             
             <Button onClick={handleAnalyze} disabled={!file || !jd}>
                Proceed to Analysis
             </Button>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          <GlassCard hover={false}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant={activeTab === 'analysis' ? 'primary' : 'secondary'} onClick={() => fetchAction('analysis')} disabled={loading}>Detailed Analysis</Button>
              <Button variant={activeTab === 'gaps' ? 'primary' : 'secondary'} onClick={() => fetchAction('gaps')} disabled={loading}>Identify Gaps</Button>
              <Button variant={activeTab === 'score' ? 'primary' : 'secondary'} onClick={() => fetchAction('score')} disabled={loading}>Percentage Match</Button>
            </div>
          </GlassCard>

          {loading && (
            <GlassCard hover={false} className="text-center py-16">
              <div className="flex flex-col items-center justify-center">
                 <svg className="w-12 h-12 animate-spin text-violet mb-4" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                 </svg>
                 <p className="text-white/60">AI is analyzing your resume...</p>
                 <p className="text-white/30 text-xs mt-2">This may take a few seconds.</p>
              </div>
            </GlassCard>
          )}

          {!loading && resultData && (
             <GlassCard hover={false}>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="p-2 bg-violet/20 text-violet rounded-lg">
                    {activeTab === 'analysis' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>}
                    {activeTab === 'gaps' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
                    {activeTab === 'score' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
                  </span>
                  {activeTab === 'analysis' && 'Professional Analysis'}
                  {activeTab === 'gaps' && 'Missing Keywords & Skill Gaps'}
                  {activeTab === 'score' && 'ATS Score Report'}
                </h3>
                
                {isScoreTab ? (
                  <div className="bg-white/[0.02] p-8 rounded-xl border border-white/5">
                    {/* Animated Circle */}
                    <ScoreCircle score={parsedScore} />
                    
                    {/* Segregated Keywords */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Key Missing Keywords</h4>
                      {parsedKeywords.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {parsedKeywords.map((kw, idx) => (
                            <span key={idx} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg shadow-sm">
                              {kw}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-emerald-400 text-sm">No missing keywords! Your profile perfectly aligns.</p>
                      )}
                    </div>

                    {/* Segregated Summary */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3 border-b border-white/10 pb-2">Profile Summary</h4>
                      <p className="text-white/80 leading-relaxed text-sm">
                         {parsedSummary || "Could not parse profile summary from AI response."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/[0.02] p-6 rounded-xl border border-white/5 overflow-hidden">
                    {resultData.startsWith('Error') ? (
                      <p className="text-red-400">{resultData}</p>
                    ) : (
                      <div className="w-full max-w-full">
                        <ReactMarkdown components={MarkdownComponents}>
                          {resultData.replace(/\*\*/g, '**').replace(/\*/g, '*')}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
             </GlassCard>
          )}

          {!loading && !resultData && (
            <GlassCard hover={false} className="text-center py-16">
              <div className="w-16 h-16 bg-white/[0.02] rounded-full mx-auto flex items-center justify-center mb-4">
                 <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                 </svg>
              </div>
              <p className="text-white/50">Select an option above to generate insights using AI.</p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}

export default ATSChecker;
