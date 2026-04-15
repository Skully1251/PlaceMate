import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlocksOrb from './BlocksOrb';
import { MicIcon, StopIcon } from './icons';
import api from '../../utils/api';
import { getRandomQuestionCount } from '../../utils/questionEngine.js';

function ResumeInterview({ initialHistory, language, onEndInterview, maxQuestions: maxQuestionsProp }) {
    const [maxQuestions] = useState(() => maxQuestionsProp || getRandomQuestionCount());
    const [chatHistory, setChatHistory] = useState(initialHistory);
    const [displayedResponse, setDisplayedResponse] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [questionCount, setQuestionCount] = useState(0);
    const [interviewComplete, setInterviewComplete] = useState(false);
    
    const [selectedVoice, setSelectedVoice] = useState(null);
    const [voicesReady, setVoicesReady] = useState(false);

    const recognitionRef = useRef(null);
    const typewriterTimeoutRef = useRef(null);
    const boundaryEventsFired = useRef(false);
    const hasSpokenIntro = useRef(false); // Ref to prevent the intro from looping

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return;

            console.log(`Searching for a voice for language: ${language}`);
            
            let voiceForLang = voices.find(voice => voice.lang === language) || voices.find(voice => voice.lang.startsWith(language.split('-')[0]));

            if (voiceForLang) {
                console.log(`Found voice: ${voiceForLang.name}`);
                setSelectedVoice(voiceForLang);
            } else {
                console.warn(`No voice found for ${language}. Falling back to default.`);
                const fallbackVoice = voices.find(voice => voice.lang === 'en-US') || voices.find(voice => voice.lang.startsWith('en'));
                setSelectedVoice(fallbackVoice);
            }
            setVoicesReady(true);
        };

        const kickstart = () => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(' ');
            window.speechSynthesis.speak(utterance);
        };
        
        kickstart();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        loadVoices();
    }, [language]);

    const callBackendAPI = async (history) => {
    setIsLoading(true);
    setDisplayedResponse('');
    try {
        const res = await api.post('/api/chat', { history });
        return res.data.message || "I'm sorry, an error occurred.";
    } catch (error) {
        console.error("Backend API Error:", error);
        return "An error occurred. Let's try that again.";
    } finally {
        setIsLoading(false);
    }
};


    const startListening = useCallback(() => {
        if (!isListening && !isSpeaking) {
            setTranscript('');
            if(recognitionRef.current) {
                recognitionRef.current.lang = language;
                recognitionRef.current.start();
            }
            setIsListening(true);
        }
    }, [isListening, isSpeaking, language]);

    const speak = useCallback((text) => {
        window.speechSynthesis.cancel();
        if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
        
        setIsSpeaking(true);
        setDisplayedResponse('');
        boundaryEventsFired.current = false;
        const utterance = new SpeechSynthesisUtterance(text);
        
        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        } else {
            utterance.lang = language;
        }
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                boundaryEventsFired.current = true;
                const spokenText = text.substring(0, event.charIndex + event.charLength);
                setDisplayedResponse(spokenText);
            }
        };

        const words = text.trim().split(' ').filter(Boolean);
        let currentWordIndex = 0;
        const typewriter = () => {
            if (!boundaryEventsFired.current && currentWordIndex < words.length) {
                setDisplayedResponse(words.slice(0, currentWordIndex + 1).join(' '));
                currentWordIndex++;
                const avgWordTime = 350; 
                typewriterTimeoutRef.current = setTimeout(typewriter, avgWordTime);
            }
        };
        
        utterance.onstart = () => {
            setTimeout(typewriter, 100);
        };

        utterance.onend = () => {
            if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
            setDisplayedResponse(text);
            setIsSpeaking(false);
            if (!interviewComplete) {
                startListening();
            }
        };
        
        window.speechSynthesis.speak(utterance);
    }, [selectedVoice, language, startListening, interviewComplete]);

    const handleUserResponse = useCallback(async () => {
        if (!transcript.trim()) return;
        const userMessage = transcript;
        let currentHistory = [...chatHistory, { role: 'user', parts: [{ text: userMessage }] }];
        setTranscript('');
        
        const isLastQuestion = questionCount >= maxQuestions;
        if (isLastQuestion) {
            currentHistory.push({ role: 'user', parts: [{ text: `${userMessage} --- THIS WAS THE FINAL QUESTION. Please provide a brief concluding remark...`}]});
        }
        const aiResponse = await callBackendAPI(currentHistory);
        setChatHistory([...currentHistory, { role: 'model', parts: [{ text: aiResponse }] }]);
        speak(aiResponse);
        if (isLastQuestion) { 
            setInterviewComplete(true); 
        } else { 
            setQuestionCount(prev => prev + 1); 
        }
    }, [transcript, chatHistory, questionCount, speak]);

    const stopListeningAndSubmit = useCallback(() => {
        if (recognitionRef.current) { recognitionRef.current.stop(); }
        setIsListening(false);
        handleUserResponse();
    }, [handleUserResponse]);
    
    useEffect(() => {
        if (!('webkitSpeechRecognition' in window)) { 
            console.error("Speech recognition not supported.");
            return; 
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;
        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) { finalTranscript += event.results[i][0].transcript; }
            }
            if (finalTranscript) { setTranscript(prev => prev.trim() ? `${prev.trim()} ${finalTranscript}` : finalTranscript); }
        };
        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
    }, [language]);

    useEffect(() => {
        let silenceTimeout;
        if (isListening && transcript) {
            silenceTimeout = setTimeout(() => {
                if (isListening) stopListeningAndSubmit();
            }, 2000);
        }
        return () => clearTimeout(silenceTimeout);
    }, [isListening, transcript, stopListeningAndSubmit]);

    const handleEndInterviewClick = async () => {
        setIsLoading(true);
        const finalMessage = "The interview is over. Based on our entire conversation, provide the final feedback...";
        const finalHistory = [...chatHistory, { role: 'user', parts: [{ text: finalMessage }] }];
        const feedbackResponse = await callBackendAPI(finalHistory);
        try {
            const jsonString = feedbackResponse.match(/\{[\s\S]*\}/)[0];
            const feedbackJson = JSON.parse(jsonString);
            onEndInterview(feedbackJson);
        } catch (e) {
            console.error("Failed to parse final feedback:", e);
            onEndInterview({
                strengths: ["Completed the interview."],
                weaknesses: ["Error parsing the final report from AI response."],
                advice: ["The AI's response might not have been in the correct JSON format. Please try again."],
                score: 0,
            });
        } finally { setIsLoading(false); }
    };

    useEffect(() => {
        const startInterview = async () => {
            if (hasSpokenIntro.current) return;
            hasSpokenIntro.current = true;

            const introduction = initialHistory.find(m => m.role === 'model')?.parts[0]?.text;
            if (introduction) {
                speak(introduction);
                // We don't count the intro as a question
                setQuestionCount(0); 
            }
        };
        if (voicesReady) {
            startInterview();
        }
        return () => {
            window.speechSynthesis.cancel();
            if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [voicesReady]);

    const toggleMic = () => {
        if(isListening) stopListeningAndSubmit();
        else startListening();
    }

    return (
        <div className="flex flex-col h-[70vh] items-center justify-between text-center">
            <div className="relative w-full h-80 flex-shrink-0 flex items-center justify-center">
                <BlocksOrb isSpeaking={isSpeaking} isListening={isListening} />
            </div>
            <div className="flex flex-col items-center justify-center p-4 w-full max-w-3xl flex-1 overflow-y-auto custom-scrollbar">
                 <p className="text-3xl md:text-4xl font-medium text-white/90">
                    {isLoading ? '...' : 
                        displayedResponse.split(' ').map((word, index) => (
                            <span key={index} className="word-fade-in">{word}&nbsp;</span>
                        ))
                    }
                 </p>
            </div>
            <div className="w-full flex flex-col items-center flex-shrink-0">
                {interviewComplete ? (
                    <button onClick={handleEndInterviewClick} disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full shadow-none transition-transform transform hover:scale-105 disabled:opacity-50 disabled:scale-100">
                        {isLoading ? "Generating Feedback..." : "Get Evaluation"}
                    </button>
                ) : (
                    <button onClick={toggleMic} disabled={isSpeaking || isLoading} className={`p-6 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(90,70,218,0.2)] text-white ${isListening ? 'bg-red-500 animate-pulse-red' : 'bg-violet hover:bg-orange-600'} disabled:bg-slate-400 disabled:cursor-not-allowed`}>
                        {isListening ? <StopIcon className="w-10 h-10"/> : <MicIcon className="w-10 h-10"/>}
                    </button>
                )}
                 <p className="text-sm text-white/50 mt-4">
                    {interviewComplete ? "Interview Complete" : `Question ${questionCount > 0 ? questionCount : '...'} of ${maxQuestions}`}
                 </p>
            </div>
        </div>
    );
}

export default ResumeInterview;