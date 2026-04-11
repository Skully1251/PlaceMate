import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage.jsx';
import DashboardLayout from './components/dashboard/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import InterviewPrep from './pages/InterviewPrep.jsx';
import ResumeGenerator from './pages/ResumeGenerator.jsx';
import ATSChecker from './pages/ATSChecker.jsx';
import InternshipFinder from './pages/InternshipFinder.jsx';
import CompanyPrep from './pages/CompanyPrep.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen font-sans relative overflow-x-hidden">
          <LandingPage />
        </div>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="interview-prep" element={<InterviewPrep />} />
        <Route path="resume-generator" element={<ResumeGenerator />} />
        <Route path="ats-checker" element={<ATSChecker />} />
        <Route path="internship-finder" element={<InternshipFinder />} />
        <Route path="company-prep" element={<CompanyPrep />} />
        <Route path="settings" element={<SettingsPlaceholder />} />
      </Route>
    </Routes>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-blush mb-1">Settings</h2>
      <p className="text-blush/40 text-sm mb-6">Manage your account and preferences</p>
      <div className="bg-surface/50 border border-violet/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface border border-violet/10 flex items-center justify-center text-blush/20">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <p className="text-blush/30 text-sm">Settings page coming soon</p>
      </div>
    </div>
  );
}

export default App;