
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Compass, 
  Settings, 
  LogOut, 
  Plus, 
  FolderSearch,
  Zap,
  User as UserIcon
} from 'lucide-react';
import { mockUser, mockSlideSpaces } from '../../data/mock';

interface DashboardLayoutProps {
  onLogout: () => void;
  onAuthClick: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout, onAuthClick }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');

  const navItems = [
    { label: 'Start', path: '/dashboard/start', icon: LayoutDashboard, authRequired: true },
    { label: 'Explore', path: '/dashboard/explore', icon: Compass, authRequired: false },
  ];

  return (
    <div className="flex h-full w-full bg-[#09090b]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-[#0c0c0e]">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-black fill-black" />
          </div>
          <span className="font-bold text-lg tracking-tight">Slidev.ai</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            (!item.authRequired || isAuthenticated) && (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          ))}

          {isAuthenticated && (
            <div className="pt-6">
              <div className="px-3 mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">My Spaces</span>
                <button className="p-1 hover:bg-white/5 rounded transition-colors">
                  <Plus className="w-3 h-3 text-white/40" />
                </button>
              </div>
              <div className="space-y-1">
                {mockSlideSpaces.map(space => (
                  <Link
                    key={space.id}
                    to={`/slide/${space.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <FolderSearch className="w-4 h-4" />
                    <span className="truncate">{space.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/5">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <Link to="/settings/info" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/5 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-2 rounded-lg text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#09090b]">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
