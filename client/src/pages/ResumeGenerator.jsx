import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';
import Button from '../components/dashboard/Button';
import Input from '../components/dashboard/Input';

function ResumeGenerator() {
  const [step, setStep] = useState(1);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [codolio, setCodolio] = useState('');
  const [email, setEmail] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [repos, setRepos] = useState([]);
  const [selectedRepos, setSelectedRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [progress, setProgress] = useState(0);
  const [latexCode, setLatexCode] = useState('');
  const [timeTaken, setTimeTaken] = useState(0);
  
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(containerRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
  }, [step]);

  const extractGithubUsername = (input) => {
    if (!input) return '';
    try {
      const url = new URL(input);
      if (url.hostname.includes('github.com')) {
        const parts = url.pathname.split('/').filter(Boolean);
        return parts[0] || '';
      }
    } catch {
      return input.replace('@', '').split('/')[0];
    }
    return input;
  };

  useEffect(() => {
    const handleFetch = async () => {
      const username = extractGithubUsername(github);
      if (!username) {
        setRepos([]);
        return;
      }
      setLoadingRepos(true);
      try {
        const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
        if (res.ok) {
          const data = await res.json();
          setRepos(data);
        } else {
          setRepos([]);
        }
      } catch {
        setRepos([]);
      } finally {
        setLoadingRepos(false);
      }
    };
    const timeout = setTimeout(handleFetch, 800);
    return () => clearTimeout(timeout);
  }, [github]);

  const handleRepoSelect = (repo) => {
    if (selectedRepos.find(r => r.id === repo.id)) {
      setSelectedRepos(selectedRepos.filter(r => r.id !== repo.id));
    } else if (selectedRepos.length < 3) {
      setSelectedRepos([...selectedRepos, repo]);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
      setProgress(0);
      
      // Simulate progress visually while actual generation happens
      let curr = 0;
      const progressInterval = setInterval(() => {
        curr = Math.min(curr + Math.random() * 5, 95);
        setProgress(Math.floor(curr));
      }, 500);

      try {
        const startTimeStr = Date.now();
        const token = localStorage.getItem('firebaseToken');
        const res = await fetch('http://localhost:3001/api/resume/generate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            github,
            linkedin,
            codolio,
            email,
            jobDesc,
            repos: selectedRepos
          })
        });

        if (res.ok) {
          const data = await res.json();
          setLatexCode(data.latex);
          setTimeTaken(data.timeTakenMs || (Date.now() - startTimeStr));
        } else {
          setLatexCode('% Failed to generated LaTeX from AI');
          setTimeTaken(Date.now() - startTimeStr);
        }
      } catch (error) {
        setLatexCode('% Error generating LaTeX: ' + error.message);
        setTimeTaken(1000);
      } finally {
        clearInterval(progressInterval);
        setProgress(100);
        setTimeout(() => setStep(3), 500);
      }
    } else if (step === 3) {
      setStep(4);
    }
  };

  const jobDescWordCount = jobDesc.trim().split(/\s+/).filter(Boolean).length;
  const isFormValid = github && linkedin && codolio && selectedRepos.length === 3 && jobDescWordCount >= 50;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <GlassCard hover={false}>
            <h3 className="text-lg font-semibold text-white mb-6">Import Your Profiles</h3>
            <Input label="GitHub Username or URL *" placeholder="octocat or https://github.com/octocat" value={github} onChange={e => setGithub(e.target.value)} className="mb-4" />
            <Input label="LinkedIn Profile *" placeholder="linkedin.com/in/username" value={linkedin} onChange={e => setLinkedin(e.target.value)} className="mb-4" />
            <Input label="Codolio Profile URL *" placeholder="https://codolio.com/profile/username" value={codolio} onChange={e => setCodolio(e.target.value)} className="mb-4" />
            <Input label="Email Address" placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} className="mb-4" />
            
            {github && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/70 mb-2">Select 3 GitHub Repositories *</label>
                {loadingRepos ? (
                  <p className="text-white/50 text-sm">Loading repositories...</p>
                ) : (
                  <div className="space-y-2">
                    {repos.map((repo) => (
                      <div 
                        key={repo.id} 
                        className={`p-3 rounded-lg border cursor-pointer select-none transition-colors ${
                          selectedRepos.find(r => r.id === repo.id) 
                            ? 'bg-violet/20 border-violet/40' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                        onClick={() => handleRepoSelect(repo)}
                      >
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={!!selectedRepos.find(r => r.id === repo.id)}
                            readOnly
                            className="w-4 h-4 rounded text-violet focus:ring-violet/30 border-white/20 bg-black/20"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium">{repo.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/60 text-xs">
                                {repo.language || 'N/A'}
                              </span>
                            </div>
                            <p className="text-white/40 text-xs mt-1">{repo.description || 'No description available'}</p>
                            <div className="flex items-center gap-1 mt-1 text-white/40 text-xs">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span>{repo.stargazers_count} stars</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {repos.length === 0 && !loadingRepos && <p className="text-white/50 text-sm">No repositories found.</p>}
                  </div>
                )}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">Job Description *</label>
              <textarea
                placeholder="Paste the job description here..."
                value={jobDesc}
                onChange={e => setJobDesc(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet/30 transition-all min-h-[120px]"
              />
              <p className={`text-xs mt-1 ${jobDescWordCount < 50 ? 'text-red-400' : 'text-green-400'}`}>
                {jobDescWordCount} / 50 words minimum
              </p>
            </div>
            
            <Button onClick={handleNext} fullWidth disabled={!isFormValid}>Next</Button>
          </GlassCard>
        );
      case 2:
        return (
          <GlassCard hover={false}>
            <div className="text-center py-12 px-4">
              <h2 className="text-3xl font-bold text-white mb-3">AI is Generating Your CV</h2>
              <p className="text-white/60 mb-12">Please wait while our AI analyzes your profiles and creates a professional CV</p>
              
              <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">Initializing Gemini CV Builder...</span>
                  <span className="text-sm font-bold text-white">{progress}%</span>
                </div>
                <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden mb-12">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                <div className="flex justify-center mb-10">
                  <svg className="w-16 h-16 text-blue-500 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
                
                <p className="text-white/50 text-sm">This usually takes about 3 minutes. Please wait...</p>
              </div>
            </div>
          </GlassCard>
        );
      case 3:
        return (
          <GlassCard hover={false}>
            <div className="text-center py-12 px-4">
              <h2 className="text-3xl font-bold text-white mb-3">AI is Generating Your CV</h2>
              <p className="text-white/60 mb-12">Please wait while our AI analyzes your profiles and creates a professional CV</p>
              
              <div className="max-w-xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 shadow-lg text-center">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-white">CV generated successfully!</span>
                  <span className="text-sm font-bold text-white">100%</span>
                </div>
                <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden mb-12">
                  <div className="h-full bg-green-500 transition-all duration-200" style={{ width: '100%' }} />
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-green-400 mb-6">✨ Your professional CV has been generated!</h3>
                <p className="text-white/50 text-sm mb-6">Time Taken: {(timeTaken / 1000).toFixed(2)}s • Click Next to view and edit it</p>
                
                <Button onClick={handleNext} fullWidth>Next</Button>
              </div>

              <div className="mt-12 text-left bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-bold text-white">Generated LaTeX Code</h3>
                    <p className="text-sm text-white/50">Raw LaTeX source for your CV generated by AI in {(timeTaken / 1000).toFixed(2)} seconds</p>
                  </div>
                </div>
                <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 border border-white/10 font-mono whitespace-pre-wrap">
                  {latexCode}
                </pre>
              </div>
            </div>
          </GlassCard>
        );
      case 4:
        return (
          <GlassCard hover={false} className="h-screen max-h-[800px] flex flex-col">
            <div className="p-6 flex justify-between items-center border-b border-white/10 shrink-0">
                 <h2 className="text-xl font-bold text-white flex items-center gap-2">
                   <svg className="w-5 h-5 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                   </svg>
                   AI-Generated CV
                 </h2>
                 <Button variant="secondary" onClick={() => window.open(`https://latexonline.cc/compile?text=${encodeURIComponent(latexCode)}`, '_blank')} className="flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                   Download Resume
                 </Button>
               </div>
               
               <div className="flex-grow bg-white/5 border-t border-white/10 rounded-b-xl overflow-hidden relative">
                 <iframe 
                   src={`https://latexonline.cc/compile?text=${encodeURIComponent(latexCode)}`}
                   className="w-full h-full border-none"
                   title="Compiled Resume"
                 />
                 <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center -z-10">
                   <svg className="w-12 h-12 text-blue-500 animate-spin mb-4" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                   </svg>
                   <p className="text-white/60">Compiling your CV...</p>
                 </div>
               </div>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Resume Generator</h2>
        <p className="text-white/50 text-sm">Build an ATS-friendly resume from your profiles</p>
      </div>
      {renderStep()}
    </div>
  );
}

export default ResumeGenerator;
