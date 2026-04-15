import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlocksOrb from './BlocksOrb';
import { MicIcon, StopIcon } from './icons';
import api from '../../utils/api';
import { getRandomQuestionCount, generateBehavioralTopics } from '../../utils/questionEngine.js';

function HRInterview({ language, onEndInterview }) {
    const [maxQuestions] = useState(() => getRandomQuestionCount());
    const [sessionTopics] = useState(() => generateBehavioralTopics(6));
    const [chatHistory, setChatHistory] = useState([]);
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
    const hasSpokenIntro = useRef(false);

    useEffect(() => {
        const loadVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length === 0) return;
            
            let voiceForLang = voices.find(voice => voice.lang === language) || 
                              voices.find(voice => voice.lang.startsWith(language.split('-')[0]));

            if (voiceForLang) {
                setSelectedVoice(voiceForLang);
            } else {
                const fallbackVoice = voices.find(voice => voice.lang === 'en-US') || 
                                     voices.find(voice => voice.lang.startsWith('en'));
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

    useEffect(() => {
        if (voicesReady && !hasSpokenIntro.current && chatHistory.length === 0) {
            hasSpokenIntro.current = true;
            initializeBehavioralInterview();
        }
    }, [voicesReady]);

    const initializeBehavioralInterview = async () => {
        const introMessage = language === 'hi-IN'
            ? 'नमस्ते! मैं नेक्सा हूँ, और आज मैं आपका व्यवहारिक साक्षात्कार संचालित करूँगा। मैं आपसे कुछ सामान्य HR प्रश्न पूछूँगा। तैयार होने पर शुरू करते हैं।'
            : "Hello! I'm Nexa, and I'll be conducting your behavioral interview today. I'll ask you some common HR questions to understand your personality, work style, and experience. Let's begin when you're ready.";
        
        const systemPrompt = getBehavioralSystemPrompt(language, maxQuestions, sessionTopics);
        const history = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: introMessage }] }
        ];
        
        setChatHistory(history);
        speak(introMessage);
    };

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
            currentHistory.push({ 
                role: 'user', 
                parts: [{ text: `${userMessage} --- THIS WAS THE FINAL QUESTION. Please provide a brief concluding remark...`}]
            });
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
        } catch (error) {
            console.error("Error parsing feedback:", error);
            onEndInterview({
                score: 75,
                strengths: ["Good communication", "Clear responses"],
                weaknesses: ["Could provide more examples"],
                advice: ["Practice STAR method", "Prepare specific stories"]
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(90,70,218,0.2)] max-w-3xl mx-auto">
                <h2 className="text-2xl font-semibold mb-6 text-center text-white/90">
                    Behavioral Interview with <span className="text-green-500 font-bold">Nexa</span>
                </h2>

                <div className="mb-8 h-64 flex items-center justify-center">
                    <BlocksOrb isSpeaking={isSpeaking} isListening={isListening} />
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6 h-[180px] overflow-y-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                            <span className="ml-3 text-white/70">Thinking...</span>
                        </div>
                    ) : (
                        <p className="text-white/90 text-lg leading-relaxed">
                            {displayedResponse || "Waiting for Nexa..."}
                        </p>
                    )}
                </div>

                {transcript && (
                    <div className="bg-white/[0.05] border border-white/20 rounded-2xl p-5 mb-6 shadow-md transition-all">
                        <p className="text-sm text-green-400 font-bold mb-2 uppercase tracking-wide">Your answer:</p>
                        <p className="text-white">{transcript}</p>
                    </div>
                )}

                <div className="flex flex-col items-center space-y-4">
                    {isListening ? (
                        <button
                            onClick={stopListeningAndSubmit}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all flex items-center space-x-3"
                        >
                            <StopIcon className="w-6 h-6" />
                            <span>Stop & Submit</span>
                        </button>
                    ) : (
                        !interviewComplete && (
                            <button
                                onClick={startListening}
                                disabled={isSpeaking || isLoading}
                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all flex items-center space-x-3 disabled:opacity-50"
                            >
                                <MicIcon className="w-6 h-6" />
                                <span>Start Speaking</span>
                            </button>
                        )
                    )}

                    {interviewComplete && (
                        <button
                            onClick={handleEndInterviewClick}
                            disabled={isLoading}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all transform hover:scale-105 disabled:opacity-50"
                        >
                            {isLoading ? 'Generating Feedback...' : 'End Interview & Get Feedback'}
                        </button>
                    )}
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-white/50">
                        Question {Math.min(questionCount + 1, maxQuestions)} of {maxQuestions}
                    </p>
                </div>
            </div>
        </div>
    );
}

const getBehavioralSystemPrompt = (lang, maxQ, topics) => {
  const topicHints = (topics || []).slice(0, maxQ || 5).map((t, i) => `${i + 1}. ${t}`).join('\n');
  return `
You are an expert HR interviewer named 'Nexa'. Your task is to conduct a behavioral interview.
**You MUST conduct the entire interview, including all questions and feedback, in the language specified by the language code: ${lang}.**

Here are your instructions:
1.  **Language & Script**: The primary language for this session is ${lang}. All your responses must be in this language. **If the language code is 'hi-IN', you MUST respond using the Devanagari script.**
2.  **Formatting**: Your responses MUST be plain text only. Do not use any markdown formatting, especially asterisks (*), bolding, or lists.
3.  **Goal**: Assess the candidate's soft skills, work ethic, problem-solving approach, teamwork, and cultural fit. Ask a total of ${maxQ || 5} behavioral questions.
4.  **Persona**: Maintain a professional, friendly, and conversational tone. You have already introduced yourself; your first response should be the first question.
5.  **Question Types**: Use these topic areas as inspiration for your questions (phrase them naturally):
${topicHints}
6.  **Questioning Flow**: Ask ONE question at a time and wait for the candidate's response.
7.  **Adaptive Response Analysis**:
    -   If the candidate's answer is detailed with examples: Give brief, positive reinforcement then move to the next question.
    -   If the candidate's answer is vague or lacks examples: Ask a follow-up question to get more specific details.
8.  **Conclusion**: After the ${maxQ || 5}th question, provide a brief concluding remark, thank the candidate, and tell them they can now access their feedback.
9.  **Final Feedback Generation**: After the interview concludes, you will receive a final prompt. Your response to this MUST be ONLY a single JSON object with the keys 'strengths', 'weaknesses', 'advice', and 'score'. The text within the arrays must also be in the specified language and script.
`;
};

export default HRInterview;
