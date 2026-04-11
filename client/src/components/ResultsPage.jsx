import React from 'react';

function ResultsPage({ feedback, onStartNew }) {
    if (!feedback) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-semibold mb-4">Generating Feedback...</h2>
                <p>Please wait a moment.</p>
            </div>
        );
    }
    const { score, strengths, weaknesses, advice } = feedback;
    return (
        <div className="animate-fade-in text-center p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl">
            <h2 className="text-3xl font-bold mb-4 text-slate-800">Interview Complete!</h2>
            <p className="text-slate-600 mb-8">Here is your performance feedback from Nexa.</p>
            <div className="mb-8">
                <div className={`radial-progress text-orange-500 border-4 border-slate-200`} style={{"--value":score || 0, "--size":"12rem", "--thickness": "1rem"}}>
                    <span className="text-5xl font-bold text-slate-800">{score || 0}</span>
                    <span className="text-sm text-slate-500">/100</span>
                </div>
            </div>
            <div className="text-left grid md:grid-cols-3 gap-6">
                <div className="bg-slate-50/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-green-600">Strengths</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                        {Array.isArray(strengths) && strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-red-600">Areas for Improvement</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                        {Array.isArray(weaknesses) && weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-3 text-blue-600">Actionable Advice</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                         {Array.isArray(advice) && advice.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                </div>
            </div>
            <button onClick={onStartNew} className="mt-10 bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-transform transform hover:scale-105">
                Start New Interview
            </button>
        </div>
    );
}

export default ResultsPage;