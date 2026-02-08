
import React from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { User as UserIcon, Code, Bell, Shield, ArrowLeft } from 'lucide-react';
import { mockUser } from '../../data/mock';

const SettingsPage: React.FC = () => {
  const location = useLocation();

  const sidebarLinks = [
    { label: 'Profile', path: 'info', icon: UserIcon },
    { label: 'Snippets', path: 'snippets', icon: Code },
    { label: 'Notifications', path: 'notifications', icon: Bell },
    { label: 'Security', path: 'security', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-white">
      {/* Settings Sidebar */}
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
                to={link.path}
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

      {/* Settings Content */}
      <main className="flex-1 p-12 overflow-y-auto max-w-4xl">
        <Routes>
          <Route index element={<Navigate to="info" replace />} />
          <Route path="info" element={
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Info</h1>
                <p className="text-white/40">Manage your account details and public appearance.</p>
              </div>

              <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
                 <div className="relative group">
                    <img src={mockUser.avatar} className="w-24 h-24 rounded-2xl object-cover" />
                    <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-bold rounded-2xl transition-opacity">Change</button>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold">{mockUser.name}</h3>
                    <p className="text-white/40 text-sm">{mockUser.email}</p>
                    <button className="mt-3 px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-all">Upload Photo</button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none" defaultValue={mockUser.name} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none" defaultValue={mockUser.email} />
                </div>
              </div>
            </div>
          } />
          <Route path="snippets" element={
            <div className="space-y-8">
               <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Code Snippets</h1>
                <p className="text-white/40">Store re-usable components and scripts for your slides.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all group">
                     <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                           <Code className="w-5 h-5 text-white/30" />
                           <h4 className="font-semibold">Slide Layout Custom - {i}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded uppercase font-bold text-white/40">CSS</span>
                     </div>
                     <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-white/50 border border-white/5 group-hover:text-white/80 transition-colors">
                        .slide-v-custom {'{'} display: flex; align-items: center; justify-content: center; {'}'}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default SettingsPage;
