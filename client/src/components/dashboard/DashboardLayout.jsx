import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom'; import Sidebar from './Sidebar'; import Topbar from './Topbar';
const pageTitles = { '/dashboard': 'Dashboard', '/dashboard/interview-prep': 'Interview Prep', '/dashboard/resume-generator': 'Resume Generator', '/dashboard/ats-checker': 'ATS Checker', '/dashboard/internship-finder': 'Internship Finder', '/dashboard/company-prep': 'Company Prep', '/dashboard/settings': 'Settings' };
function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation(); const title = pageTitles[location.pathname] || 'Dashboard'; const sidebarWidth = collapsed ? 72 : 260;
  return (
    <div className="min-h-screen font-sans relative">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="transition-all duration-300 min-h-screen flex flex-col" style={{ marginLeft: `${sidebarWidth}px` }}>
        <style>{`@media (max-width: 1023px) { div[style*="marginLeft"] { margin-left: 0 !important; } }`}</style>
        <Topbar title={title} onMenuClick={() => setMobileOpen(!mobileOpen)} /><main className="flex-1 p-4 md:p-6 overflow-x-hidden"><Outlet /></main>
      </div>
    </div>
  );
}
export default DashboardLayout;
