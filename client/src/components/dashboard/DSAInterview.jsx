import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlocksOrb from './BlocksOrb';
import { MicIcon, StopIcon } from './icons';
import api from '../../utils/api';
import { getRandomQuestionCount, generateDSADifficultyMix } from '../../utils/questionEngine.js';


function DSAInterview({ onEndInterview, onStart }) {
    const [maxQuestions] = useState(() => getRandomQuestionCount());
    const [step, setStep] = useState('difficulty'); // 'difficulty', 'loading', 'coding', 'explaining', 'complete'
    const [difficulty, setDifficulty] = useState('');
    const [language, setLanguage] = useState('python');
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [explanation, setExplanation] = useState('');
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [results, setResults] = useState([]); // evaluations for each question
    
    const recognitionRef = useRef(null);
    const [selectedVoice, setSelectedVoice] = useState(null);

    const codeTemplates = {
        python: 'class Solution(object):\n    def problem():\n       # Write your code here\n       pass\n',
        java: 'class Solution {\n    public boolean problem() {\n        // Write your code here\n    }\n}\n',
        cpp: 'class Solution {\npublic:\n    bool problem() {\n        // Write your code here\n    }\n};\n'
    };

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return;
            const voice = voices.find(v => v.lang === 'en-US') || voices[0];
            setSelectedVoice(voice);
        };
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }, []);

    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) return;
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(prev => prev.trim() ? `${prev.trim()} ${finalTranscript}` : finalTranscript);
            }
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
    }, []);

    useEffect(() => {
        if (code === '') {
            setCode(codeTemplates[language]);
        }
    }, [language]);
    
    const fetchAllDSAQuestions = async (diff) => {
        setIsLoading(true);
        setStep('loading');
        
        const difficultyMix = generateDSADifficultyMix(maxQuestions);
        const fetchedQuestions = [];
        
        for (let i = 0; i < maxQuestions; i++) {
            try {
                const diffLevel = diff === 'intern' ? 'intern' : 'sde';
                const res = await api.post('/api/dsa/question', { difficulty: diffLevel });
                fetchedQuestions.push({
                    ...res.data.question,
                    assignedDifficulty: difficultyMix[i]
                });
            } catch (error) {
                fetchedQuestions.push({
                    title: `Problem ${i + 1}`,
                    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
                    difficulty: difficultyMix[i],
                    assignedDifficulty: difficultyMix[i]
                });
            }
        }
        
        setQuestions(fetchedQuestions);
        setCurrentQuestionIndex(0);
        setCode(codeTemplates[language]);
        setIsLoading(false);
        setStep('coding');
        
        const instruction = `I'll give you ${maxQuestions} coding problems. Here's problem 1 of ${maxQuestions}. Read the question carefully, write your solution, and click submit when ready.`;
        speak(instruction);
    };

    const handleDifficultySelect = (diff) => {
        if (onStart) onStart();
        setDifficulty(diff);
        fetchAllDSAQuestions(diff);
    };

    const speak = useCallback((text, onSpeechEnd = null) => {
        window.speechSynthesis.cancel();
        setIsSpeaking(true);
        setDisplayedResponse('');
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) utterance.voice = selectedVoice;
        
        const words = text.trim().split(' ');
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < words.length) {
                setDisplayedResponse(words.slice(0, currentIndex + 1).join(' '));
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 100);
        
        utterance.onend = () => {
            setIsSpeaking(false);
            setDisplayedResponse(text);
            clearInterval(interval);
            if (typeof onSpeechEnd === 'function') {
                onSpeechEnd();
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }, [selectedVoice]);

    const handleSubmitCode = () => {
        setStep('explaining');
        const prompt = "Great! Now please explain your approach and the time/space complexity of your solution.";
        setDisplayedResponse(prompt);
        speak(prompt, () => {
            if (recognitionRef.current) {
                setTranscript('');
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.warn(e);
                }
            }
        });
    };

    const startListening = () => {
        if (!isListening && !isSpeaking && recognitionRef.current) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const stopListeningAndSubmit = () => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        setExplanation(transcript);
        evaluateCurrentQuestion();
    };

    const evaluateCurrentQuestion = async () => {
        setIsLoading(true);
        const currentQuestion = questions[currentQuestionIndex];
        try {
            const res = await api.post('/api/dsa/evaluate', {
                question: currentQuestion,
                code,
                language,
                explanation: transcript
            });
            
            const feedback = res.data.feedback;
            setResults(prev => [...prev, {
                question: currentQuestion,
                code,
                explanation: transcript,
                feedback
            }]);

            // Move to next question or finish
            if (currentQuestionIndex + 1 < maxQuestions) {
                setCurrentQuestionIndex(prev => prev + 1);
                setCode(codeTemplates[language]);
                setTranscript('');
                setStep('coding');
                speak(`Good. Now here's problem ${currentQuestionIndex + 2} of ${maxQuestions}. Read it carefully and write your solution.`);
            } else {
                // All questions done — compute final score
                const allResults = [...results, { question: currentQuestion, code, explanation: transcript, feedback }];
                const totalScore = allResults.reduce((sum, r) => sum + (r.feedback?.score || 0), 0);
                const avgScore = Math.round(totalScore / allResults.length);
                
                const allStrengths = allResults.flatMap(r => r.feedback?.strengths || []);
                const allWeaknesses = allResults.flatMap(r => r.feedback?.weaknesses || []);
                const allAdvice = allResults.flatMap(r => r.feedback?.advice || []);
                
                onEndInterview({
                    score: avgScore,
                    strengths: [...new Set(allStrengths)].slice(0, 5),
                    weaknesses: [...new Set(allWeaknesses)].slice(0, 5),
                    advice: [...new Set(allAdvice)].slice(0, 5),
                });
            }
        } catch (error) {
            console.error('Error evaluating DSA:', error);
            // Still move forward
            setResults(prev => [...prev, {
                question: currentQuestion,
                code,
                explanation: transcript,
                feedback: { score: 50, strengths: ['Attempted'], weaknesses: ['Evaluation error'], advice: ['Try again'] }
            }]);
            
            if (currentQuestionIndex + 1 < maxQuestions) {
                setCurrentQuestionIndex(prev => prev + 1);
                setCode(codeTemplates[language]);
                setTranscript('');
                setStep('coding');
                speak(`Let's move on to problem ${currentQuestionIndex + 2} of ${maxQuestions}.`);
            } else {
                onEndInterview({
                    score: 50,
                    strengths: ['Completed all problems'],
                    weaknesses: ['Some evaluations failed'],
                    advice: ['Please try again for accurate scoring'],
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (step === 'difficulty') {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-white mb-4">
                    Select Difficulty Level
                </h2>
                <p className="text-center text-white/50 mb-8">
                    You'll solve <strong>{maxQuestions} problems</strong> in this session
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <DifficultyCard
                        title="Intern Position"
                        description={`${maxQuestions} questions with mixed difficulty suitable for internship interviews`}
                        difficulty="Intermediate"
                        onClick={() => handleDifficultySelect('intern')}
                        color="blue"
                    />
                    <DifficultyCard
                        title="SDE Position"
                        description={`${maxQuestions} questions with mixed difficulty for software engineer roles`}
                        difficulty="Advanced"
                        onClick={() => handleDifficultySelect('sde')}
                        color="purple"
                    />
                </div>
            </div>
        );
    }

    if (step === 'loading') {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-white/70">Loading {maxQuestions} questions...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'coding') {
        const currentQuestion = questions[currentQuestionIndex];
        return (
            <div className="animate-fade-in">
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                currentQuestion?.assignedDifficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                                currentQuestion?.assignedDifficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                            }`}>
                                {currentQuestion?.assignedDifficulty?.toUpperCase() || currentQuestion?.difficulty?.toUpperCase()}
                            </span>
                        </div>
                        <span className="text-sm font-semibold text-white/50">
                            Problem {currentQuestionIndex + 1} of {maxQuestions}
                        </span>
                    </div>

                    {currentQuestion ? (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-4">{currentQuestion.title}</h2>
                            <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
                                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{currentQuestion.description}</p>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white/90 mb-2">Select Language</label>
                                <select 
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full md:w-48 bg-white/[0.02] border border-white/10 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="python" className="text-black">Python</option>
                                    <option value="java" className="text-black">Java</option>
                                    <option value="cpp" className="text-black">C++</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-white/90 mb-2">Your Code</label>
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-96 bg-black/60 text-green-400 font-mono text-sm p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    spellCheck="false"
                                />
                            </div>

                            <button
                                onClick={handleSubmitCode}
                                disabled={!code.trim() || code === codeTemplates[language]}
                                className="w-full bg-gradient-to-r from-violet to-indigo-500 hover:from-violet/80 hover:to-indigo-500/80 text-white font-bold py-3 px-6 rounded-lg shadow-none transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Code
                            </button>
                        </>
                    ) : null}

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="flex justify-between text-xs text-white/50 mb-1">
                            <span>Progress</span>
                            <span>{currentQuestionIndex}/{maxQuestions} completed</span>
                        </div>
                        <div className="h-2 bg-white/[0.1] rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-violet to-indigo-500 rounded-full transition-all duration-500"
                                style={{ width: `${(currentQuestionIndex / maxQuestions) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'explaining') {
        return (
            <div className="animate-fade-in">
                <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">Explain Your Solution</h2>
                    <p className="text-sm text-white/50 text-center mb-6">
                        Problem {currentQuestionIndex + 1} of {maxQuestions}
                    </p>
                    
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-white font-medium">Evaluating your solution...</p>
                        </div>
                    )}
                    
                    <div className="mb-6 h-48 flex items-center justify-center">
                        <BlocksOrb isSpeaking={isSpeaking} isListening={isListening} />
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6 h-[180px] overflow-y-auto custom-scrollbar">
                        <p className="text-white/90 text-lg leading-relaxed">
                            {displayedResponse || "Waiting for Nexa..."}
                        </p>
                    </div>

                    {transcript && (
                        <div className="bg-white/[0.05] border border-white/20 rounded-2xl p-5 mb-6 shadow-md transition-all">
                            <p className="text-sm text-green-400 font-bold mb-2 uppercase tracking-wide">Your explanation:</p>
                            <p className="text-white">{transcript}</p>
                        </div>
                    )}

                    <div className="flex justify-center">
                        {isListening ? (
                            <button
                                onClick={stopListeningAndSubmit}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all flex items-center space-x-3"
                            >
                                <StopIcon className="w-6 h-6" />
                                <span>Stop & Submit</span>
                            </button>
                        ) : (
                            <button
                                onClick={startListening}
                                disabled={isSpeaking}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all flex items-center space-x-3 disabled:opacity-50"
                            >
                                <MicIcon className="w-6 h-6" />
                                <span>Start Explaining</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

function DifficultyCard({ title, description, difficulty, onClick, color }) {
    const colorClasses = {
        blue: 'from-violet to-indigo-500 hover:from-violet/80 hover:to-indigo-500/80',
        purple: 'from-purple-500 to-purple-600 hover:from-violet/80 hover:to-indigo-500/80'
    };

    return (
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:shadow-[0_0_15px_rgba(90,70,218,0.2)] transition-all">
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-white/70 mb-4">{description}</p>
            <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-white/[0.1] text-white/90 rounded-full text-sm font-semibold">
                    {difficulty}
                </span>
            </div>
            <button
                onClick={onClick}
                className={`w-full bg-gradient-to-r ${colorClasses[color]} text-white font-bold py-3 px-6 rounded-lg shadow-none transition-all transform hover:scale-105`}
            >
                Choose This Level
            </button>
        </div>
    );
}

export default DSAInterview;
