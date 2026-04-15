import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import GlassCard from '../components/dashboard/GlassCard';
import Input from '../components/dashboard/Input';
import { companyData } from '../data/companyPrepData';
import api from '../utils/api.js';

function CompanyPrep() {
  const containerRef = useRef(null);
  
  // Views: 'topics' | 'companies' | 'questions'
  const [view, setView] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Filters and state
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  
  // Solved tracking via API
  const [completedSet, setCompletedSet] = useState(new Set());
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Animations on view change
  useEffect(() => {
    gsap.fromTo(containerRef.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }
    );
  }, [view]);

  // Fetch progress when viewing questions for a company
  useEffect(() => {
    if (view === 'questions' && selectedTopic && selectedCompany) {
      fetchProgress();
    }
  }, [view, selectedTopic, selectedCompany]);

  const fetchProgress = async () => {
    setLoadingProgress(true);
    try {
      const res = await api.get(`/api/company/progress/${encodeURIComponent(selectedTopic)}/${encodeURIComponent(selectedCompany)}`);
      setCompletedSet(new Set(res.data.solvedIds || []));
    } catch (err) {
      console.error('Failed to fetch progress:', err);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleToggleCompleted = async (questionId) => {
    const newSet = new Set(completedSet);
    const wasSolved = newSet.has(questionId);

    // Optimistic update
    if (wasSolved) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setCompletedSet(newSet);

    // Sync with backend
    try {
      if (wasSolved) {
        await api.post('/api/company/unsolve', {
          topic: selectedTopic,
          company: selectedCompany,
          questionId,
        });
      } else {
        await api.post('/api/company/solve', {
          topic: selectedTopic,
          company: selectedCompany,
          questionId,
        });
      }
    } catch (err) {
      console.error('Failed to toggle question:', err);
      // Revert optimistic update
      const revertSet = new Set(completedSet);
      if (wasSolved) {
        revertSet.add(questionId);
      } else {
        revertSet.delete(questionId);
      }
      setCompletedSet(revertSet);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setDifficultyFilter('All');
  };

  const getDifficultyColor = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20';
      case 'medium': return 'text-orange-400 bg-orange-400/10 border border-orange-400/20';
      case 'hard': return 'text-rose-400 bg-rose-400/10 border border-rose-400/20';
      default: return 'text-white/70 bg-white/5 border border-white/10';
    }
  };

  // ----------------------------------------------------
  // Views Rendering
  // ----------------------------------------------------

  const renderTopics = () => {
    const topics = Object.keys(companyData).filter(t => 
      !search || t.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topics.map(topic => {
            const tData = companyData[topic];
            if (!tData) return null;
            
            const numCompanies = Object.keys(tData.companies || {}).length;
            const numQuestions = Object.values(tData.companies || {}).reduce(
              (acc, qList) => acc + (qList?.length || 0), 0
            );

            return (
              <GlassCard 
                key={topic} 
                className="cursor-pointer group hover:-translate-y-1 transition-all"
                onClick={() => {
                  setSelectedTopic(topic);
                  setView('companies');
                  resetFilters();
                }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-3xl shrink-0 border border-white/5 bg-white/5">
                    {tData.icon || '📚'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-violet transition-colors">{topic}</h3>
                    <p className="text-xs text-white/50">{tData.desc}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{numCompanies}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Companies</p>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-violet">{numQuestions}</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">Questions</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </>
    );
  };

  const renderCompanies = () => {
    const topicData = companyData[selectedTopic];
    if (!topicData) return null;

    const companies = Object.keys(topicData.companies || {}).filter(c => 
      !search || c.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => a.localeCompare(b));

    return (
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {companies.map(company => {
          const qList = topicData.companies[company] || [];
          return (
            <GlassCard 
              key={company} 
              className="cursor-pointer group hover:-translate-y-1 transition-all flex flex-col justify-between"
              onClick={() => {
                setSelectedCompany(company);
                setView('questions');
                resetFilters();
              }}
            >
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet transition-colors truncate">{company.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-white/40 mt-1">{qList.length} Questions</p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet opacity-0 group-hover:opacity-100 transition-opacity">
                View Questions <span className="text-lg leading-none">&rarr;</span>
              </div>
            </GlassCard>
          );
        })}
        {companies.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/50">
            No companies found matching "{search}"
          </div>
        )}
      </div>
    );
  };

  const renderQuestions = () => {
    const qList = companyData[selectedTopic]?.companies[selectedCompany] || [];
    
    const filtered = qList.filter(q => {
      const matchesSearch = !search || q.name.toLowerCase().includes(search.toLowerCase());
      const matchesDiff = difficultyFilter === 'All' || q.diff === difficultyFilter;
      return matchesSearch && matchesDiff;
    });

    return (
      <div className="space-y-3">
        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['All', 'Easy', 'Medium', 'Hard'].map(diff => (
            <button
              key={diff}
              onClick={() => setDifficultyFilter(diff)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                difficultyFilter === diff 
                  ? 'bg-violet text-white border-violet shadow-lg shadow-violet/20' 
                  : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>

        {loadingProgress && (
          <div className="text-center py-4 text-white/40 text-sm">Loading progress...</div>
        )}

        {/* Question List */}
        {filtered.map((q, i) => {
          const qId = `${selectedTopic}-${selectedCompany}-${q.name}`;
          const isDone = completedSet.has(qId);
          
          return (
            <div key={qId} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${isDone ? 'bg-emerald-400/5 border-emerald-400/20' : 'bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'}`}>
              <div className="flex items-center gap-4">
                {/* Custom Checkbox */}
                <button 
                  onClick={() => handleToggleCompleted(qId)}
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border transition-colors ${
                    isDone 
                      ? 'bg-emerald-500 border-emerald-500 text-white' 
                      : 'bg-black/20 border-white/20 text-transparent hover:border-violet'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                
                <div>
                  <h4 className={`font-medium transition-colors ${isDone ? 'text-white/60 line-through' : 'text-white'}`}>
                    {q.name}
                  </h4>
                  <div className="md:hidden mt-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${getDifficultyColor(q.diff)}`}>
                      {q.diff}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 shrink-0 sm:ml-auto pl-10 sm:pl-0">
                <span className={`hidden md:inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${getDifficultyColor(q.diff)}`}>
                  {q.diff}
                </span>
                
                <a 
                  href={q.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                  Solve 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-12 text-center text-white/50 bg-white/5 rounded-xl border border-white/5">
            No questions found matching your filters.
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header and Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <button 
              onClick={() => { setView('topics'); resetFilters(); }}
              className={`transition-colors ${view === 'topics' ? 'text-violet' : 'text-white/40 hover:text-white'}`}
            >
              Topics
            </button>
            
            {view !== 'topics' && (
              <>
                <span className="text-white/20">/</span>
                <button 
                  onClick={() => { setView('companies'); resetFilters(); }}
                  className={`transition-colors ${view === 'companies' ? 'text-violet' : 'text-white/40 hover:text-white'}`}
                >
                  {selectedTopic}
                </button>
              </>
            )}
            
            {view === 'questions' && (
              <>
                <span className="text-white/20">/</span>
                <span className="text-white/80 truncate max-w-[200px]">
                  {selectedCompany.replace(/_/g, ' ')}
                </span>
              </>
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-1">
            {view === 'topics' && 'Company Prep'}
            {view === 'companies' && `${selectedTopic} Companies`}
            {view === 'questions' && selectedCompany.replace(/_/g, ' ')}
          </h2>
          <p className="text-white/50 text-sm">
            {view === 'topics' && 'Browse popular interview topics and companies'}
            {view === 'companies' && `Select a company to view their ${selectedTopic} questions`}
            {view === 'questions' && `${selectedTopic} questions asked at ${selectedCompany.replace(/_/g, ' ')}`}
          </p>
        </div>

        <div className="w-full md:w-64 shrink-0">
          <Input 
            placeholder={view === 'topics' ? "Search topics..." : view === 'companies' ? "Search companies..." : "Search questions..."}
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            icon={<svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>} 
          />
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[50vh]">
        {view === 'topics' && renderTopics()}
        {view === 'companies' && renderCompanies()}
        {view === 'questions' && renderQuestions()}
      </div>
    </div>
  );
}

export default CompanyPrep;
