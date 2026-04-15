import React, { useState, useEffect, useRef, useCallback } from 'react';
import BlocksOrb from './BlocksOrb';
import VoiceIndicator, { ProgressStepper } from './VoiceIndicator';
import { MicIcon, StopIcon, UploadIcon } from './icons';
import { getRandomQuestionCount, generateBehavioralTopics, generateDSADifficultyMix } from '../../utils/questionEngine.js';
import useVoice from '../../hooks/useVoice.js';
import api from '../../utils/api';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const STEPS = ['Setup', 'Resume Round', 'DSA Round', 'Behavioral Round', 'Results'];

function CombinedInterview({ onEndInterview, onStart }) {
  // ── Phase / navigation ──
  const [phase, setPhase] = useState('setup'); // setup | resume | dsa | behavioral | evaluating
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // ── Setup state ──
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [codingLanguage, setCodingLanguage] = useState('python');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [setupError, setSetupError] = useState('');
  const fileInputRef = useRef(null);

  // ── Interview data store ──
  const [interviewData, setInterviewData] = useState({
    userInfo: {},
    rounds: {
      resume: { questions: [], roundScore: 0 },
      dsa: { questions: [], roundScore: 0 },
      behavioral: { questions: [], roundScore: 0 },
    },
    overallScore: 0,
    finalVerdict: '',
    strengths: [],
    weaknesses: [],
  });

  // ── Resume round state ──
  const [resumeChatHistory, setResumeChatHistory] = useState([]);
  const [resumeQuestionCount, setResumeQuestionCount] = useState(0);
  const [resumeMaxQuestions, setResumeMaxQuestions] = useState(0);
  const [resumeInterviewComplete, setResumeInterviewComplete] = useState(false);
  const [resumeQAs, setResumeQAs] = useState([]);
  const resumeInitRef = useRef(false);

  // ── DSA round state ──
  const [dsaQuestions, setDsaQuestions] = useState([]);
  const [dsaCurrentIndex, setDsaCurrentIndex] = useState(0);
  const [dsaStep, setDsaStep] = useState('loading'); // loading | coding | explaining
  const [dsaCode, setDsaCode] = useState('');
  const [dsaMaxQuestions, setDsaMaxQuestions] = useState(0);
  const [dsaQAs, setDsaQAs] = useState([]);
  const dsaInitRef = useRef(false);

  // ── Behavioral round state ──
  const [behavioralChatHistory, setBehavioralChatHistory] = useState([]);
  const [behavioralQuestionCount, setBehavioralQuestionCount] = useState(0);
  const [behavioralMaxQuestions, setBehavioralMaxQuestions] = useState(0);
  const [behavioralInterviewComplete, setBehavioralInterviewComplete] = useState(false);
  const [behavioralQAs, setBehavioralQAs] = useState([]);
  const behavioralInitRef = useRef(false);

  // ── Loading ──
  const [isLoading, setIsLoading] = useState(false);

  // ── Shared voice hook ──
  const shouldAutoListen = !(phase === 'dsa' && dsaStep === 'coding');
  const voice = useVoice({ autoListenAfterSpeak: shouldAutoListen, silenceTimeout: 2500 });

  const codeTemplates = {
    python: 'class Solution(object):\n    def problem():\n       # Write your code here\n       pass\n',
    java: 'class Solution {\n    public boolean problem() {\n        // Write your code here\n    }\n}\n',
    cpp: 'class Solution {\npublic:\n    bool problem() {\n        // Write your code here\n    }\n};\n'
  };

  const jobRoles = ["Software Engineer", "Product Manager", "Data Scientist", "UX/UI Designer", "Marketing Manager", "DevOps Engineer"];

  // ────────────────────────────────────────────────
  // SETUP PHASE
  // ────────────────────────────────────────────────

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name);
      setSetupError('');
      setIsParsing(true);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const typedarray = new Uint8Array(e.target.result);
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
        setSetupError('Failed to parse PDF. Please try again.');
        setFileName('');
        setResumeText('');
        setIsParsing(false);
      }
    } else {
      setSetupError('Please upload a valid PDF file.');
    }
  };

  const handleStartCombined = () => {
    if (!resumeText.trim()) {
      setSetupError('Please upload your resume to start.');
      return;
    }
    setSetupError('');
    setInterviewData(prev => ({
      ...prev,
      userInfo: { role: targetRole, language: codingLanguage, resumeText }
    }));
    if (onStart) onStart();
    
    // Initialize resume round
    const maxQ = getRandomQuestionCount();
    setResumeMaxQuestions(maxQ);
    setPhase('resume');
    setCurrentStepIndex(1);
  };

  // ────────────────────────────────────────────────
  // RESUME ROUND
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'resume' && voice.voicesReady && !resumeInitRef.current) {
      resumeInitRef.current = true;
      initResumeRound();
    }
  }, [phase, voice.voicesReady]);

  const initResumeRound = async () => {
    const introMessage = `Great! Let's begin with the Resume Round. I'll ask you ${resumeMaxQuestions} questions about your experience and skills based on your resume. Let's start with the first question.`;
    
    const systemPrompt = `You are an expert technical interviewer named 'Nexa'. Conduct a resume-based interview for the role of '${targetRole}'.
The candidate's resume:
--- START RESUME ---
${resumeText}
--- END RESUME ---
Instructions:
1. Ask exactly ${resumeMaxQuestions} questions total based on the resume.
2. Language: English only. Plain text only — no markdown, no asterisks, no bold, no lists.
3. Ask ONE question at a time and wait for the answer.
4. If the answer is strong, give brief positive reinforcement then ask the next question.
5. If the answer is weak, ask a brief follow-up, then move on.
6. After the last question, provide a brief concluding remark.
7. Your first response should be the first question (you have already introduced yourself).`;

    const history = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: introMessage }] },
    ];
    setResumeChatHistory(history);
    
    // Get first question
    const firstQ = await callBackendAPI([...history, { role: 'user', parts: [{ text: 'Please ask the first question.' }] }]);
    const updatedHistory = [
      ...history,
      { role: 'user', parts: [{ text: 'Please ask the first question.' }] },
      { role: 'model', parts: [{ text: firstQ }] },
    ];
    setResumeChatHistory(updatedHistory);
    setResumeQuestionCount(1);
    voice.speak(firstQ);
    
    // Store the first question
    setResumeQAs([{ question: firstQ, answer: '', score: 0, feedback: '' }]);
  };

  // Handle silence auto-stop for resume round
  useEffect(() => {
    if (phase === 'resume' && !voice.isListening && voice.transcript && !isLoading && !voice.isSpeaking) {
      handleResumeAnswer();
    }
  }, [voice.isListening, phase]);

  const handleResumeAnswer = async () => {
    if (!voice.transcript.trim() || isLoading) return;
    const userMessage = voice.transcript;
    voice.resetTranscript();

    // Update QAs with the answer
    setResumeQAs(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].answer = userMessage;
      }
      return updated;
    });

    let currentHistory = [...resumeChatHistory, { role: 'user', parts: [{ text: userMessage }] }];

    const isLastQuestion = resumeQuestionCount >= resumeMaxQuestions;
    if (isLastQuestion) {
      currentHistory.push({
        role: 'user',
        parts: [{ text: `${userMessage} --- THIS WAS THE FINAL QUESTION. Please provide a brief concluding remark.` }]
      });
    }

    const aiResponse = await callBackendAPI(currentHistory);
    const updatedHistory = [...currentHistory, { role: 'model', parts: [{ text: aiResponse }] }];
    setResumeChatHistory(updatedHistory);
    voice.speak(aiResponse);

    if (isLastQuestion) {
      setResumeInterviewComplete(true);
    } else {
      setResumeQuestionCount(prev => prev + 1);
      // Add next question to QAs
      setResumeQAs(prev => [...prev, { question: aiResponse, answer: '', score: 0, feedback: '' }]);
    }
  };

  const handleEndResumeRound = async () => {
    setIsLoading(true);
    
    // Get evaluation for the resume round
    const finalMessage = `The resume interview is over. Based on the entire conversation, evaluate each answer. Return ONLY a JSON object: { "roundScore": <0-100>, "questions": [{"score": <0-100>, "feedback": "<brief feedback>"}], "strengths": ["..."], "weaknesses": ["..."] }`;
    const finalHistory = [...resumeChatHistory, { role: 'user', parts: [{ text: finalMessage }] }];
    const feedbackResponse = await callBackendAPI(finalHistory);

    try {
      const jsonString = feedbackResponse.match(/\{[\s\S]*\}/)[0];
      const feedback = JSON.parse(jsonString);
      
      // Merge feedback into QAs
      const updatedQAs = resumeQAs.map((qa, idx) => ({
        ...qa,
        score: feedback.questions?.[idx]?.score || 0,
        feedback: feedback.questions?.[idx]?.feedback || '',
      }));

      setInterviewData(prev => ({
        ...prev,
        rounds: {
          ...prev.rounds,
          resume: { questions: updatedQAs, roundScore: feedback.roundScore || 0 }
        }
      }));
    } catch (e) {
      console.error('Failed to parse resume feedback:', e);
      setInterviewData(prev => ({
        ...prev,
        rounds: {
          ...prev.rounds,
          resume: { questions: resumeQAs, roundScore: 60 }
        }
      }));
    }

    setIsLoading(false);
    
    // Move to DSA round
    const maxQ = getRandomQuestionCount();
    setDsaMaxQuestions(maxQ);
    setPhase('dsa');
    setCurrentStepIndex(2);
  };

  // ────────────────────────────────────────────────
  // DSA ROUND
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'dsa' && voice.voicesReady && !dsaInitRef.current) {
      dsaInitRef.current = true;
      initDSARound();
    }
  }, [phase, voice.voicesReady]);

  const initDSARound = async () => {
    if (voice.isListening) voice.stopListening();
    setDsaStep('loading');
    setIsLoading(true);

    const difficultyMix = generateDSADifficultyMix(dsaMaxQuestions);
    const intro = `Now let's move to the DSA Round. I'll give you ${dsaMaxQuestions} coding problems with mixed difficulty. For each one, read the problem, write your code, then explain your approach.`;
    voice.speak(intro);

    // Fetch all DSA questions
    const questions = [];
    for (let i = 0; i < dsaMaxQuestions; i++) {
      try {
        const res = await api.post('/api/dsa/question', { difficulty: difficultyMix[i] === 'easy' ? 'intern' : 'sde' });
        questions.push({ ...res.data.question, difficulty: difficultyMix[i] });
      } catch (e) {
        questions.push({
          title: `Problem ${i + 1}`,
          description: 'Given an array of integers, find the maximum sum subarray.',
          difficulty: difficultyMix[i]
        });
      }
    }

    setDsaQuestions(questions);
    setDsaCurrentIndex(0);
    setDsaCode(codeTemplates[codingLanguage]);
    setIsLoading(false);
    setDsaStep('coding');
  };

  const handleDsaSubmitCode = () => {
    setDsaStep('explaining');
    const prompt = "Great! Now please explain your approach and the time/space complexity of your solution.";
    voice.speak(prompt);
  };

  // Handle silence auto-stop for DSA explanation
  useEffect(() => {
    if (phase === 'dsa' && dsaStep === 'explaining' && !voice.isListening && voice.transcript && !isLoading && !voice.isSpeaking) {
      handleDsaExplanation();
    }
  }, [voice.isListening, phase, dsaStep]);

  const handleDsaExplanation = async () => {
    if (!voice.transcript.trim() || isLoading) return;
    const explanation = voice.transcript;
    voice.resetTranscript();
    setIsLoading(true);

    try {
      const currentQuestion = dsaQuestions[dsaCurrentIndex];
      const res = await api.post('/api/dsa/evaluate', {
        question: currentQuestion,
        code: dsaCode,
        language: codingLanguage,
        explanation: explanation
      });

      const feedback = res.data.feedback;
      setDsaQAs(prev => [...prev, {
        question: `${currentQuestion.title} (${currentQuestion.difficulty})`,
        code: dsaCode,
        explanation: explanation,
        answer: explanation,
        score: feedback?.score || 0,
        feedback: (feedback?.strengths || []).join(', ') + '. ' + (feedback?.advice || []).join(', ')
      }]);
    } catch (e) {
      setDsaQAs(prev => [...prev, {
        question: dsaQuestions[dsaCurrentIndex]?.title || 'Unknown',
        code: dsaCode,
        explanation: explanation,
        answer: explanation,
        score: 50,
        feedback: 'Evaluation error occurred.'
      }]);
    }

    setIsLoading(false);

    // Move to next question or finish
    if (dsaCurrentIndex + 1 < dsaMaxQuestions) {
      setDsaCurrentIndex(prev => prev + 1);
      setDsaCode(codeTemplates[codingLanguage]);
      setDsaStep('coding');
      voice.speak(`Question ${dsaCurrentIndex + 2} of ${dsaMaxQuestions}. Please read the next problem and write your solution.`);
    } else {
      handleEndDSARound();
    }
  };

  const handleEndDSARound = () => {
    // Calculate DSA round score
    const totalScore = dsaQAs.reduce((sum, qa) => sum + (qa.score || 0), 0);
    const roundScore = Math.round(totalScore / (dsaQAs.length || 1));

    setInterviewData(prev => ({
      ...prev,
      rounds: {
        ...prev.rounds,
        dsa: { questions: dsaQAs, roundScore }
      }
    }));

    // Move to behavioral round
    const maxQ = getRandomQuestionCount();
    setBehavioralMaxQuestions(maxQ);
    setPhase('behavioral');
    setCurrentStepIndex(3);
  };

  // ────────────────────────────────────────────────
  // BEHAVIORAL ROUND
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (phase === 'behavioral' && voice.voicesReady && !behavioralInitRef.current) {
      behavioralInitRef.current = true;
      initBehavioralRound();
    }
  }, [phase, voice.voicesReady]);

  const initBehavioralRound = async () => {
    const topics = generateBehavioralTopics(behavioralMaxQuestions);
    const topicHints = topics.map((t, i) => `${i + 1}. ${t}`).join('\n');

    const introMessage = `Excellent! Now let's move to the final round — the Behavioral Interview. I'll ask you ${behavioralMaxQuestions} questions about your work experience and soft skills. Let's begin.`;

    const systemPrompt = `You are an expert HR interviewer named 'Nexa'. Conduct a behavioral interview.
Instructions:
1. Ask exactly ${behavioralMaxQuestions} questions. Use these topics as guidance (but phrase naturally):
${topicHints}
2. Language: English only. Plain text only — no markdown.
3. Ask ONE question at a time.
4. If the answer is detailed with examples, give brief reinforcement then move on.
5. If the answer is vague, ask a brief follow-up.
6. After the last question, provide a brief concluding remark.
7. Your first response should be the first question.`;

    const history = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: introMessage }] },
    ];
    setBehavioralChatHistory(history);
    
    // Get first question
    const firstQ = await callBackendAPI([...history, { role: 'user', parts: [{ text: 'Please ask the first question.' }] }]);
    const updatedHistory = [
      ...history,
      { role: 'user', parts: [{ text: 'Please ask the first question.' }] },
      { role: 'model', parts: [{ text: firstQ }] },
    ];
    setBehavioralChatHistory(updatedHistory);
    setBehavioralQuestionCount(1);
    voice.speak(firstQ);
    
    setBehavioralQAs([{ question: firstQ, answer: '', score: 0, feedback: '' }]);
  };

  // Handle silence auto-stop for behavioral round
  useEffect(() => {
    if (phase === 'behavioral' && !voice.isListening && voice.transcript && !isLoading && !voice.isSpeaking) {
      handleBehavioralAnswer();
    }
  }, [voice.isListening, phase]);

  const handleBehavioralAnswer = async () => {
    if (!voice.transcript.trim() || isLoading) return;
    const userMessage = voice.transcript;
    voice.resetTranscript();

    setBehavioralQAs(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].answer = userMessage;
      }
      return updated;
    });

    let currentHistory = [...behavioralChatHistory, { role: 'user', parts: [{ text: userMessage }] }];

    const isLastQuestion = behavioralQuestionCount >= behavioralMaxQuestions;
    if (isLastQuestion) {
      currentHistory.push({
        role: 'user',
        parts: [{ text: `${userMessage} --- THIS WAS THE FINAL QUESTION. Please provide a brief concluding remark.` }]
      });
    }

    const aiResponse = await callBackendAPI(currentHistory);
    const updatedHistory = [...currentHistory, { role: 'model', parts: [{ text: aiResponse }] }];
    setBehavioralChatHistory(updatedHistory);
    voice.speak(aiResponse);

    if (isLastQuestion) {
      setBehavioralInterviewComplete(true);
    } else {
      setBehavioralQuestionCount(prev => prev + 1);
      setBehavioralQAs(prev => [...prev, { question: aiResponse, answer: '', score: 0, feedback: '' }]);
    }
  };

  const handleEndBehavioralRound = async () => {
    setIsLoading(true);

    const finalMessage = `The behavioral interview is over. Evaluate each answer. Return ONLY a JSON object: { "roundScore": <0-100>, "questions": [{"score": <0-100>, "feedback": "<brief feedback>"}], "strengths": ["..."], "weaknesses": ["..."] }`;
    const finalHistory = [...behavioralChatHistory, { role: 'user', parts: [{ text: finalMessage }] }];
    const feedbackResponse = await callBackendAPI(finalHistory);

    try {
      const jsonString = feedbackResponse.match(/\{[\s\S]*\}/)[0];
      const feedback = JSON.parse(jsonString);

      const updatedQAs = behavioralQAs.map((qa, idx) => ({
        ...qa,
        score: feedback.questions?.[idx]?.score || 0,
        feedback: feedback.questions?.[idx]?.feedback || '',
      }));

      // Calculate overall and set final data
      const resumeScore = interviewData.rounds.resume.roundScore;
      const dsaScore = interviewData.rounds.dsa.roundScore;
      const behavioralScore = feedback.roundScore || 0;
      const overallScore = Math.round((resumeScore + dsaScore + behavioralScore) / 3);

      const allStrengths = [
        ...(interviewData.rounds.resume.questions || []).filter(q => q.score >= 70).map(q => q.feedback).filter(Boolean),
        ...(feedback.strengths || []),
      ];
      const allWeaknesses = [
        ...(interviewData.rounds.resume.questions || []).filter(q => q.score < 50).map(q => q.feedback).filter(Boolean),
        ...(feedback.weaknesses || []),
      ];

      setInterviewData(prev => ({
        ...prev,
        rounds: {
          ...prev.rounds,
          behavioral: { questions: updatedQAs, roundScore: behavioralScore }
        },
        overallScore,
        strengths: allStrengths.slice(0, 6),
        weaknesses: allWeaknesses.slice(0, 6),
        finalVerdict: overallScore >= 75
          ? 'Strong candidate with excellent performance across all rounds. Recommended for next stage.'
          : overallScore >= 50
          ? 'Decent performance with room for improvement. Consider additional preparation in weaker areas.'
          : 'Significant areas need improvement. We recommend focused practice before the actual interview.',
      }));
    } catch (e) {
      console.error('Failed to parse behavioral feedback:', e);
      const overallScore = Math.round((interviewData.rounds.resume.roundScore + interviewData.rounds.dsa.roundScore + 60) / 3);
      setInterviewData(prev => ({
        ...prev,
        rounds: {
          ...prev.rounds,
          behavioral: { questions: behavioralQAs, roundScore: 60 }
        },
        overallScore,
        strengths: ['Completed all interview rounds'],
        weaknesses: ['Feedback parsing error occurred'],
        finalVerdict: 'Interview completed. Please review individual round results.',
      }));
    }

    setIsLoading(false);
    setPhase('evaluating');
    setCurrentStepIndex(4);

    // Trigger callback after a moment
    setTimeout(() => {
      onEndInterview(interviewData);
    }, 500);
  };

  // ────────────────────────────────────────────────
  // SHARED HELPER
  // ────────────────────────────────────────────────

  const callBackendAPI = async (history) => {
    setIsLoading(true);
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

  const toggleMic = () => {
    if (voice.isListening) voice.stopListening();
    else voice.startListening();
  };

  // ────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────

  // ── SETUP ──
  if (phase === 'setup') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <ProgressStepper currentStep={0} steps={STEPS} />
        <div className="mt-8 p-8 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
          <h2 className="text-2xl font-bold text-center text-white mb-2">Combined Interview Setup</h2>
          <p className="text-center text-white/50 mb-8">Complete all 3 rounds in one session</p>
          
          {setupError && (
            <div className="bg-red-500/10 border border-red-400 text-red-700 p-3 rounded-lg mb-6 text-center">{setupError}</div>
          )}

          {/* Resume Upload */}
          <div className="mb-6">
            <label className="block text-base font-medium text-white/70 mb-3">Upload your Resume</label>
            <div
              className="flex justify-center items-center w-full h-36 px-6 transition bg-white/[0.02] border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:border-purple-400"
              onClick={() => fileInputRef.current.click()}
            >
              <span className="flex items-center space-x-4">
                <UploadIcon className="w-8 h-8 text-slate-400" />
                <span className="text-lg font-medium text-white/50">
                  {isParsing ? 'Parsing PDF...' : fileName ? <span className="text-green-600">{fileName}</span> : 'Click to upload a PDF'}
                </span>
              </span>
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </div>
          </div>

          {/* Coding Language */}
          <div className="mb-6">
            <label className="block text-base font-medium text-white/70 mb-3">Preferred Coding Language</label>
            <select
              value={codingLanguage}
              onChange={(e) => setCodingLanguage(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-4 text-base text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          {/* Target Role */}
          <div className="mb-8">
            <label className="block text-base font-medium text-white/70 mb-3">Target Role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/10 rounded-lg p-4 text-base text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {jobRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleStartCombined}
            disabled={isParsing || !resumeText}
            className="w-full bg-gradient-to-r from-violet to-indigo-500 hover:from-purple-600 hover:to-indigo-700 text-white text-lg font-bold py-4 px-4 rounded-lg shadow-none transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isParsing ? 'Processing...' : 'Begin Combined Interview'}
          </button>
        </div>
      </div>
    );
  }

  // ── RESUME ROUND ──
  if (phase === 'resume') {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <ProgressStepper currentStep={1} steps={STEPS} />
        <div className="mt-6 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
          <h2 className="text-2xl font-semibold mb-2 text-center text-white/90">
            Round 1: <span className="text-violet font-bold">Resume Interview</span>
          </h2>
          <VoiceIndicator isSpeaking={voice.isSpeaking} isListening={voice.isListening} isProcessing={isLoading} />

          <div className="my-6 h-56 flex items-center justify-center">
            <BlocksOrb isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6 h-[180px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                <span className="ml-3 text-white/70">Thinking...</span>
              </div>
            ) : (
              <p className="text-white/90 text-lg leading-relaxed">
                {voice.displayedResponse || 'Starting resume round...'}
              </p>
            )}
          </div>

          {voice.transcript && (
            <div className="bg-white/[0.05] border border-white/20 rounded-2xl p-5 mb-6 shadow-md transition-all">
              <p className="text-sm text-green-400 font-bold mb-2 uppercase tracking-wide">Your answer:</p>
              <p className="text-white">{voice.transcript}</p>
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            {resumeInterviewComplete ? (
              <button
                onClick={handleEndResumeRound}
                disabled={isLoading}
                className="bg-gradient-to-r from-violet to-indigo-500 hover:from-violet/80 hover:to-indigo-500/80 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all transform hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? 'Evaluating Round...' : 'Continue to DSA Round →'}
              </button>
            ) : (
              <button
                onClick={toggleMic}
                disabled={voice.isSpeaking || isLoading}
                className={`p-5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(90,70,218,0.2)] text-white ${voice.isListening ? 'bg-red-500 animate-pulse-red' : 'bg-violet hover:bg-orange-600'} disabled:bg-slate-400 disabled:cursor-not-allowed`}
              >
                {voice.isListening ? <StopIcon className="w-8 h-8" /> : <MicIcon className="w-8 h-8" />}
              </button>
            )}

            <p className="text-sm text-white/50">
              {resumeInterviewComplete ? 'Resume Round Complete' : `Question ${resumeQuestionCount || '...'} of ${resumeMaxQuestions}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── DSA ROUND ──
  if (phase === 'dsa') {
    const currentQuestion = dsaQuestions[dsaCurrentIndex];

    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <ProgressStepper currentStep={2} steps={STEPS} />
        <div className="mt-6 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
          <h2 className="text-2xl font-semibold mb-4 text-center text-white/90">
            Round 2: <span className="text-violet font-bold">DSA Interview</span>
          </h2>
          <VoiceIndicator isSpeaking={voice.isSpeaking} isListening={voice.isListening} isProcessing={isLoading} />

          {dsaStep === 'loading' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-white/70">Loading DSA questions...</p>
            </div>
          )}

          {dsaStep === 'coding' && currentQuestion && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentQuestion.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                  currentQuestion.difficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {currentQuestion.difficulty?.toUpperCase()}
                </span>
                <span className="text-sm text-white/50">Question {dsaCurrentIndex + 1} of {dsaMaxQuestions}</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-3">{currentQuestion.title}</h3>
              <div className="bg-white/[0.02] rounded-lg p-4 mb-4">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap">{currentQuestion.description}</p>
              </div>

              <div className="mb-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <label className="block text-sm font-medium text-white/90">Your Code</label>
                <select 
                  value={codingLanguage}
                  onChange={(e) => {
                      setCodingLanguage(e.target.value);
                      setDsaCode(codeTemplates[e.target.value]);
                  }}
                  className="w-full md:w-48 bg-white/[0.02] border border-white/10 rounded-lg p-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="python" className="text-black">Python</option>
                  <option value="java" className="text-black">Java</option>
                  <option value="cpp" className="text-black">C++</option>
                </select>
              </div>
              <div className="mb-4">
                <textarea
                  value={dsaCode}
                  onChange={(e) => setDsaCode(e.target.value)}
                  className="w-full h-72 bg-black/60 text-green-400 font-mono text-sm p-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  spellCheck="false"
                />
              </div>

              <button
                onClick={handleDsaSubmitCode}
                disabled={!dsaCode.trim() || dsaCode === codeTemplates[codingLanguage]}
                className="w-full bg-gradient-to-r from-violet to-indigo-500 hover:from-violet/80 hover:to-indigo-500/80 text-white font-bold py-3 px-6 rounded-lg shadow-none transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Code & Explain
              </button>
            </>
          )}

          {dsaStep === 'explaining' && (
            <>
              <div className="mb-6 h-40 flex items-center justify-center">
                <BlocksOrb isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6 h-[180px] overflow-y-auto custom-scrollbar">
                <p className="text-white/90 text-lg leading-relaxed">
                  {voice.displayedResponse || 'Explain your approach...'}
                </p>
              </div>

              {voice.transcript && (
                <div className="bg-white/[0.05] border border-white/20 rounded-2xl p-5 mb-6 shadow-md transition-all">
                  <p className="text-sm text-green-400 font-bold mb-2 uppercase tracking-wide">Your explanation:</p>
                  <p className="text-white">{voice.transcript}</p>
                </div>
              )}

              <div className="flex justify-center">
                {voice.isListening ? (
                  <button
                    onClick={voice.stopListening}
                    disabled={isLoading}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all flex items-center space-x-3"
                  >
                    <StopIcon className="w-6 h-6" />
                    <span>Stop & Submit</span>
                  </button>
                ) : (
                  <button
                    onClick={voice.startListening}
                    disabled={voice.isSpeaking || isLoading}
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all flex items-center space-x-3 disabled:opacity-50"
                  >
                    <MicIcon className="w-6 h-6" />
                    <span>Start Explaining</span>
                  </button>
                )}
              </div>

              {isLoading && (
                <div className="mt-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-white/70 text-sm">Evaluating your solution...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ── BEHAVIORAL ROUND ──
  if (phase === 'behavioral') {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <ProgressStepper currentStep={3} steps={STEPS} />
        <div className="mt-6 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-8 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
          <h2 className="text-2xl font-semibold mb-2 text-center text-white/90">
            Round 3: <span className="text-green-500 font-bold">Behavioral Interview</span>
          </h2>
          <VoiceIndicator isSpeaking={voice.isSpeaking} isListening={voice.isListening} isProcessing={isLoading} />

          <div className="my-6 h-56 flex items-center justify-center">
            <BlocksOrb isSpeaking={voice.isSpeaking} isListening={voice.isListening} />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6 h-[180px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <span className="ml-3 text-white/70">Thinking...</span>
              </div>
            ) : (
              <p className="text-white/90 text-lg leading-relaxed">
                {voice.displayedResponse || 'Starting behavioral round...'}
              </p>
            )}
          </div>

          {voice.transcript && (
            <div className="bg-white/[0.05] border border-white/20 rounded-2xl p-5 mb-6 shadow-md transition-all">
              <p className="text-sm text-green-400 font-bold mb-2 uppercase tracking-wide">Your answer:</p>
              <p className="text-white">{voice.transcript}</p>
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            {behavioralInterviewComplete ? (
              <button
                onClick={handleEndBehavioralRound}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-full shadow-none transition-all transform hover:scale-105 disabled:opacity-50"
              >
                {isLoading ? 'Generating Final Report...' : 'Finish & Get Results'}
              </button>
            ) : (
              <button
                onClick={toggleMic}
                disabled={voice.isSpeaking || isLoading}
                className={`p-5 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(90,70,218,0.2)] text-white ${voice.isListening ? 'bg-red-500 animate-pulse-red' : 'bg-green-500 hover:bg-green-600'} disabled:bg-slate-400 disabled:cursor-not-allowed`}
              >
                {voice.isListening ? <StopIcon className="w-8 h-8" /> : <MicIcon className="w-8 h-8" />}
              </button>
            )}

            <p className="text-sm text-white/50">
              {behavioralInterviewComplete ? 'Behavioral Round Complete' : `Question ${behavioralQuestionCount || '...'} of ${behavioralMaxQuestions}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── EVALUATING ──
  if (phase === 'evaluating') {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto text-center">
        <ProgressStepper currentStep={4} steps={STEPS} />
        <div className="mt-8 bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-12 shadow-[0_0_15px_rgba(90,70,218,0.2)]">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Generating Your Report</h2>
          <p className="text-white/70">Analyzing all 3 rounds of your interview...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default CombinedInterview;
