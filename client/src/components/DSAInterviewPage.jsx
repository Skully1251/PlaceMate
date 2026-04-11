import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlocksOrb from './BlocksOrb.jsx';
import { MicIcon, StopIcon } from './icons';
import api from '../api';


function DSAInterviewPage({ onEndInterview }) {
    const [step, setStep] = useState('difficulty'); // 'difficulty', 'coding', 'explaining', 'complete'
    const [difficulty, setDifficulty] = useState('');
    const [language, setLanguage] = useState('python');
    const [question, setQuestion] = useState(null);
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [explanation, setExplanation] = useState('');
    const [displayedResponse, setDisplayedResponse] = useState('');
    
    const recognitionRef = useRef(null);
    const [selectedVoice, setSelectedVoice] = useState(null);

    const codeTemplates = {
        python: '# Write your solution here\ndef solution():\n    pass\n',
        java: '// Write your solution here\nclass Solution {\n    public void solution() {\n        \n    }\n}\n',
        cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n'
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
    
const fetchDSAQuestion = async (diff) => {
    setIsLoading(true);
    try {
        const res = await api.post('/api/dsa/question', { difficulty: diff });
        setQuestion(res.data.question);

        const instruction =
            "Please read the question displayed on the screen carefully. Once you understand the problem, select your preferred programming language, write your solution in the code editor, and click submit when you're ready.";
        speak(instruction);
    } catch (error) {
        console.error('Error fetching DSA question:', error);
        setQuestion({
            title: 'Two Sum',
            description:
                'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
            difficulty: diff
        });
        speak(
            "Please read the question displayed on the screen carefully. Once you understand the problem, select your preferred programming language, write your solution in the code editor, and click submit when you're ready."
        );
    } finally {
        setIsLoading(false);
    }
};


    const handleDifficultySelect = (diff) => {
        setDifficulty(diff);
        setStep('coding');
        fetchDSAQuestion(diff);
    };

    const speak = useCallback((text) => {
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
        };
        
        window.speechSynthesis.speak(utterance);
    }, [selectedVoice]);

    const handleSubmitCode = () => {
        setStep('explaining');
        const prompt = "Great! Now please explain your approach and the time/space complexity of your solution.";
        speak(prompt);
        setDisplayedResponse(prompt);
        startListening();
    };

    const startListening = useCallback(() => {
        if (!isListening && !isSpeaking && recognitionRef.current) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening, isSpeaking]);

    const stopListeningAndSubmit = useCallback(() => {
        if (recognitionRef.current) recognitionRef.current.stop();
        setIsListening(false);
        setExplanation(transcript);
        evaluateDSA();
    }, [transcript]);

    const evaluateDSA = async () => {
    setIsLoading(true);
    try {
        const res = await api.post('/api/dsa/evaluate', {
            question,
            code,
            language,
            explanation: transcript
        });
        onEndInterview(res.data.feedback);
    } catch (error) {
        console.error('Error evaluating DSA:', error);
    } finally {
        setIsLoading(false);
    }
};


    if (step === 'difficulty') {
        return (
            <div className="animate-fade-in max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center text-slate-800 mb-8">
                    Select Difficulty Level
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <DifficultyCard
                        title="Intern Position"
                        description="Medium level questions suitable for internship interviews"
                        difficulty="Intermediate"
                        onClick={() => handleDifficultySelect('intern')}
                        color="blue"
                    />
                    <DifficultyCard
                        title="SDE Position"
                        description="Medium-hard questions for software engineer roles"
                        difficulty="Advanced"
                        onClick={() => handleDifficultySelect('sde')}
                        color="purple"
                    />
                </div>
            </div>
        );
    }

    if (step === 'coding') {
        return (
            <div className="animate-fade-in">
                <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-2xl">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-slate-600">Loading question...</p>
                        </div>
                    ) : question ? (
                        <>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">{question.title}</h2>
                            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{question.description}</p>
                            </div>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Language</label>
                                <select 
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full md:w-48 bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="python">Python</option>
                                    <option value="java">Java</option>
                                    <option value="cpp">C++</option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Your Code</label>
                                <textarea
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full h-96 bg-slate-900 text-green-400 font-mono text-sm p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    spellCheck="false"
                                />
                            </div>

                            <button
                                onClick={handleSubmitCode}
                                disabled={!code.trim() || code === codeTemplates[language]}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Code
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        );
    }

    if (step === 'explaining') {
        return (
            <div className="animate-fade-in">
                <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl p-6 shadow-2xl">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Explain Your Solution</h2>
                    
                    <div className="mb-6 h-48 flex items-center justify-center">
                        <BlocksOrb isSpeaking={isSpeaking} isListening={isListening} />
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 mb-6 min-h-[100px]">
                        <p className="text-slate-700 leading-relaxed">
                            {displayedResponse || "Waiting for AI..."}
                        </p>
                    </div>

                    {transcript && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-slate-600 mb-1">Your explanation:</p>
                            <p className="text-slate-800">{transcript}</p>
                        </div>
                    )}

                    <div className="flex justify-center">
                        {isListening ? (
                            <button
                                onClick={stopListeningAndSubmit}
                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center space-x-3"
                            >
                                <StopIcon className="w-6 h-6" />
                                <span>Stop & Submit</span>
                            </button>
                        ) : (
                            <button
                                onClick={startListening}
                                disabled={isSpeaking}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center space-x-3 disabled:opacity-50"
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
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl p-8 hover:shadow-2xl transition-all">
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
            <p className="text-slate-600 mb-4">{description}</p>
            <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-slate-200 text-slate-700 rounded-full text-sm font-semibold">
                    {difficulty}
                </span>
            </div>
            <button
                onClick={onClick}
                className={`w-full bg-gradient-to-r ${colorClasses[color]} text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105`}
            >
                Choose This Level
            </button>
        </div>
    );
}

export default DSAInterviewPage;
