import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function ProfilePage({ onStartInterview }) {
    const [jobRole, setJobRole] = useState('Software Engineer');
    const [language, setLanguage] = useState('en-US'); 
    const [resumeText, setResumeText] = useState('');
    const [fileName, setFileName] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const jobRoles = ["Software Engineer", "Product Manager", "Data Scientist", "UX/UI Designer", "Marketing Manager", "DevOps Engineer"];
    const languages = [
        { name: 'English', code: 'en-US' },
        { name: 'Hindi', code: 'hi-IN' },
        { name: 'Marathi', code: 'mr-IN' },
        { name: 'Telugu', code: 'te-IN' },
        { name: 'Malayalam', code: 'ml-IN' }
    ];

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setFileName(file.name);
            setError('');
            setIsParsing(true);
            try {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const typedarray = new Uint8Array(e.target.result);
                    const pdf = await pdfjsLib.getDocument({data: typedarray}).promise;
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
                console.error("Error parsing PDF:", err);
                setError('Failed to parse PDF. Please try again.');
                setFileName('');
                setResumeText('');
                setIsParsing(false);
            }
        } else { setError('Please upload a valid PDF file.'); }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!resumeText.trim()) {
            setError("Please upload your resume to start.");
            return;
        }
        setError('');
        onStartInterview(resumeText, jobRole, language);
    };

    return (
        <div className="animate-fade-in max-w-2xl mx-auto p-8 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-8 text-center text-slate-700">
                Start your mock interview with <span className="text-orange-500 font-bold">Nexa</span>
            </h2>
            {error && <div className="bg-red-500/10 border border-red-400 text-red-700 p-3 rounded-lg mb-6 text-center">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-8">
                 <div>
                    <label className="block text-base font-medium text-slate-600 mb-3">Upload your Resume</label>
                    <div 
                        className="flex justify-center items-center w-full h-40 px-6 transition bg-slate-50/50 border-2 border-slate-300 border-dashed rounded-xl appearance-none cursor-pointer hover:border-orange-400 focus:outline-none" 
                        onClick={() => fileInputRef.current.click()}
                    >
                        <span className="flex items-center space-x-4">
                            <UploadIcon className="w-8 h-8 text-slate-400" />
                            <span className="text-lg font-medium text-slate-500">
                                {isParsing ? "Parsing PDF..." : fileName ? <span className="text-green-600">{fileName}</span> : "Click to upload a PDF"}
                            </span>
                        </span>
                        <input ref={fileInputRef} type="file" name="file_upload" className="hidden" accept=".pdf" onChange={handleFileChange} />
                    </div>
                </div>
                <div>
                    <label htmlFor="language" className="block text-base font-medium text-slate-600 mb-3">Select Interview Language</label>
                    <select 
                        id="language" 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)} 
                        className="w-full bg-slate-50/50 border border-slate-300 rounded-lg p-4 text-base text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none transition appearance-none"
                    >
                        {languages.map(lang => (
                            <option key={lang.code} value={lang.code} className="bg-white text-slate-800">
                                {lang.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="jobRole" className="block text-base font-medium text-slate-600 mb-3">Select Job Role</label>
                    <select 
                        id="jobRole" 
                        value={jobRole} 
                        onChange={(e) => setJobRole(e.target.value)} 
                        className="w-full bg-slate-50/50 border border-slate-300 rounded-lg p-4 text-base text-slate-800 focus:ring-2 focus:ring-orange-500 focus:outline-none transition appearance-none"
                    >
                        {jobRoles.map(role => (
                            <option key={role} value={role} className="bg-white text-slate-800">
                                {role}
                            </option>
                        ))}
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={isParsing || !resumeText} 
                    className="w-full bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white text-lg font-bold py-4 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isParsing ? 'Processing...' : 'Start Your Interview'}
                </button>
            </form>
        </div>
    );
}

export default ProfilePage;