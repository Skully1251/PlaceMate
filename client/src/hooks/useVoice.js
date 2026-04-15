/**
 * useVoice — Shared voice interaction hook (TTS + STT)
 * English-only. Provides speak(), startListening(), stopListening(), and state indicators.
 */
import { useState, useEffect, useRef, useCallback } from 'react';

export default function useVoice({ onSpeechEnd, autoListenAfterSpeak = true, silenceTimeout = 2500 }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [displayedResponse, setDisplayedResponse] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voicesReady, setVoicesReady] = useState(false);

  const recognitionRef = useRef(null);
  const typewriterTimeoutRef = useRef(null);
  const watchdogTimeoutRef = useRef(null);
  const boundaryEventsFired = useRef(false);
  const silenceTimerRef = useRef(null);
  const autoListenRef = useRef(autoListenAfterSpeak);
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep refs updated
  useEffect(() => { autoListenRef.current = autoListenAfterSpeak; }, [autoListenAfterSpeak]);
  useEffect(() => { onSpeechEndRef.current = onSpeechEnd; }, [onSpeechEnd]);

  // Load English voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const voice = voices.find(v => v.lang === 'en-US') ||
                    voices.find(v => v.lang.startsWith('en')) ||
                    voices[0];
      setSelectedVoice(voice);
      setVoicesReady(true);
    };

    // Add a one-time click listener to unlock speech synthesis
    // Browsers block audio unless triggered by a direct user gesture
    const unlockAudio = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported.');
      return;
    }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
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

  // Silence detection — auto-stop after silence
  useEffect(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (isListening && transcript) {
      silenceTimerRef.current = setTimeout(() => {
        if (isListening) {
          stopListening();
        }
      }, silenceTimeout);
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [isListening, transcript, silenceTimeout]);

  const speak = useCallback((text) => {
    window.speechSynthesis.cancel();
    if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);

    setIsSpeaking(true);
    setDisplayedResponse('');
    boundaryEventsFired.current = false;

    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'en-US';
    }

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        boundaryEventsFired.current = true;
        const spokenText = text.substring(0, event.charIndex + event.charLength);
        setDisplayedResponse(spokenText);
      }
    };

    // Typewriter fallback for browsers that don't fire boundary events
    const words = text.trim().split(' ').filter(Boolean);
    let currentWordIndex = 0;
    const typewriter = () => {
      if (!boundaryEventsFired.current && currentWordIndex < words.length) {
        setDisplayedResponse(words.slice(0, currentWordIndex + 1).join(' '));
        currentWordIndex++;
        typewriterTimeoutRef.current = setTimeout(typewriter, 350);
      }
    };

    // Start typewriter immediately fallback
    setTimeout(typewriter, 100);

    // Watchdog fallback in case speechSynthesis entirely hangs and never fires onend
    const estimatedDuration = Math.max(text.length * 60 + 2000, 5000);
    watchdogTimeoutRef.current = setTimeout(() => {
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
      setDisplayedResponse(text);
      setIsSpeaking(false);
      if (autoListenRef.current) {
        startListening();
      }
    }, estimatedDuration);

    utterance.onend = () => {
      if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
      if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
      setDisplayedResponse(text);
      setIsSpeaking(false);
      if (autoListenRef.current) {
        startListening();
      }
    };

    // Delay speak by 50ms to bypass Webkit cancel() race condition bug
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  }, [selectedVoice]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isSpeaking) {
      setTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        // Already started
        console.warn('Recognition already started:', e);
      }
    }
  }, [isSpeaking]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    if (typewriterTimeoutRef.current) clearTimeout(typewriterTimeoutRef.current);
    if (watchdogTimeoutRef.current) clearTimeout(watchdogTimeoutRef.current);
    setIsSpeaking(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isSpeaking,
    isListening,
    transcript,
    displayedResponse,
    voicesReady,
    speak,
    startListening,
    stopListening,
    cancelSpeech,
    resetTranscript,
    setDisplayedResponse,
  };
}
