import React from 'react';

/**
 * VoiceIndicator — Shows the current voice interaction state.
 * - Listening: pulsing mic with ripple rings
 * - Speaking: animated sound bars
 * - Processing: spinner
 * - Idle: subtle mic icon
 */
function VoiceIndicator({ isSpeaking, isListening, isProcessing }) {
  if (isProcessing) {
    return (
      <div className="voice-indicator voice-processing">
        <div className="voice-spinner"></div>
        <span className="voice-label">Processing...</span>
      </div>
    );
  }

  if (isSpeaking) {
    return (
      <div className="voice-indicator voice-speaking">
        <div className="sound-bars">
          <div className="sound-bar bar-1"></div>
          <div className="sound-bar bar-2"></div>
          <div className="sound-bar bar-3"></div>
          <div className="sound-bar bar-4"></div>
          <div className="sound-bar bar-5"></div>
        </div>
        <span className="voice-label">Nexa is speaking...</span>
      </div>
    );
  }

  if (isListening) {
    return (
      <div className="voice-indicator voice-listening">
        <div className="mic-pulse-container">
          <div className="mic-pulse-ring ring-1"></div>
          <div className="mic-pulse-ring ring-2"></div>
          <div className="mic-pulse-ring ring-3"></div>
          <div className="mic-icon-inner">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 1a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V6a5 5 0 0 0-5-5zM5 12H4a1 1 0 0 0-1 1v1a8 8 0 0 0 8 8v3h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3a8 8 0 0 0 8-8v-1a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 0 0-1-1z"/>
            </svg>
          </div>
        </div>
        <span className="voice-label voice-label-listening">Listening...</span>
      </div>
    );
  }

  // Idle state
  return (
    <div className="voice-indicator voice-idle">
      <div className="mic-icon-idle">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
          <path d="M12 1a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V6a5 5 0 0 0-5-5zM5 12H4a1 1 0 0 0-1 1v1a8 8 0 0 0 8 8v3h-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3a8 8 0 0 0 8-8v-1a1 1 0 0 0-1-1h-1a1 1 0 0 0-1 1v1a6 6 0 0 1-12 0v-1a1 1 0 0 0-1-1z"/>
        </svg>
      </div>
      <span className="voice-label text-slate-400">Ready</span>
    </div>
  );
}

/**
 * ProgressStepper — Shows the current round progress in Combined Interview Mode.
 */
export function ProgressStepper({ currentStep, steps }) {
  return (
    <div className="progress-stepper">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = index < currentStep;
        return (
          <div key={step} className="step-item">
            <div className={`step-circle ${isComplete ? 'step-complete' : ''} ${isActive ? 'step-active' : ''}`}>
              {isComplete ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`step-label ${isActive ? 'step-label-active' : ''} ${isComplete ? 'step-label-complete' : ''}`}>
              {step}
            </span>
            {index < steps.length - 1 && (
              <div className={`step-connector ${isComplete ? 'step-connector-complete' : ''}`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default VoiceIndicator;
