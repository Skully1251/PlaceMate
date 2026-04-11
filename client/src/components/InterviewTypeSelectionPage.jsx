import React from 'react';
import { UploadIcon, MicrophoneIcon } from './icons';

function InterviewTypeSelectionPage({ onSelectType }) {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center text-slate-900 mb-4">
                Choose Your Interview Type
            </h2>
            <p className="text-center text-slate-600 text-lg mb-12 max-w-2xl mx-auto">
                Select the type of interview you'd like to practice
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
                {/* Resume Interview */}
                <InterviewTypeCard
                    icon={<UploadIcon className="w-12 h-12" />}
                    title="Resume Interview"
                    description="Practice role-specific questions based on your resume and experience"
                    features={[
                        "Upload your resume",
                        "AI asks relevant questions",
                        "Voice-based interaction",
                        "Detailed feedback"
                    ]}
                    color="orange"
                    onClick={() => onSelectType('resume')}
                />

                {/* DSA Interview */}
                <InterviewTypeCard
                    icon={
                        <svg className="w-12 h-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                        </svg>
                    }
                    title="DSA Interview"
                    description="Solve data structures and algorithms problems with live coding"
                    features={[
                        "Leetcode-style questions",
                        "Choose difficulty level",
                        "Code editor (Python/Java/C++)",
                        "Explain your solution"
                    ]}
                    color="blue"
                    onClick={() => onSelectType('dsa')}
                />

                {/* Behavioral Interview */}
                <InterviewTypeCard
                    icon={<MicrophoneIcon className="w-12 h-12" />}
                    title="Behavioral Interview"
                    description="Practice common HR and behavioral questions"
                    features={[
                        "Real HR questions",
                        "Voice-based answers",
                        "Multi-language support",
                        "Professional feedback"
                    ]}
                    color="green"
                    onClick={() => onSelectType('behavioral')}
                />
            </div>
        </div>
    );
}

function InterviewTypeCard({ icon, title, description, features, color, onClick }) {
    const colorClasses = {
        orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
        blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
        green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    };

    const iconColorClasses = {
        orange: 'bg-orange-100 text-orange-600',
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600'
    };

    return (
        <div className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-2xl p-6 hover:shadow-2xl transition-all flex flex-col">
            <div className={`inline-flex p-4 rounded-xl ${iconColorClasses[color]} mb-4 self-start`}>
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">{title}</h3>
            <p className="text-slate-600 mb-4 leading-relaxed">{description}</p>
            
            <ul className="space-y-2 mb-6 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-slate-700">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            
            <button
                onClick={onClick}
                className={`w-full bg-gradient-to-r ${colorClasses[color]} text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105`}
            >
                Start {title}
            </button>
        </div>
    );
}

export default InterviewTypeSelectionPage;
