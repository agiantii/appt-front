import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User as UserIcon, Code, Bell, Shield, ArrowLeft } from 'lucide-react';
import ProfileSettings from './components/ProfileSettings';
import SnippetSettings from './components/SnippetSettings';
import SecuritySettings from './components/SecuritySettings';

const sidebarLinks = [
  { label: 'Profile', path: 'info', icon: UserIcon },
  { label: 'Snippets', path: 'snippets', icon: Code },
  { label: 'Notifications', path: 'notifications', icon: Bell },
  { label: 'Security', path: 'security', icon: Shield },
];

const SettingsPage: React.FC = () => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#09090b] text-white">
      <aside className="w-64 border-r border-white/5 bg-[#0c0c0e] flex flex-col p-6">
        <Link to="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6 px-3">User Settings</h2>
        <nav className="space-y-1">
          {sidebarLinks.map(link => {
            const isActive = location.pathname.includes(`/settings/${link.path}`);
            return (
              <Link 
                key={link.path}
                to={`/settings/${link.path}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/30'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-12 overflow-y-auto max-w-5xl">
        <Routes>
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={<ProfileSettings />} />
          <Route path="snippets" element={<SnippetSettings />} />
          <Route path="notifications" element={<div className="text-white/40">Notifications settings coming soon...</div>} />
          <Route path="security" element={<SecuritySettings />} />
        </Routes>
      </main>
    </div>
  );
};

export default SettingsPage;
