
import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Compass, 
  Settings, 
  LogOut, 
  Plus, 
  FolderSearch,
  Zap,
  User as UserIcon,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { spaceApi } from '../../api/space';
import { SlideSpace } from '../../types';

// Toast 通知组件
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach(toast => {
      setTimeout(() => onRemove(toast.id), 2000);
    });
  }, [toasts, onRemove]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-right duration-200 ${
            toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// 创建 Space 弹窗组件
interface CreateSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreateSpaceModal: React.FC<CreateSpaceModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[400px] bg-[#1c1c1f] border border-white/10 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white/90">Create New Space</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Space Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter space name..."
              className="w-full bg-[#0c0c0e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white/90 placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/10"
              autoFocus
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Space
          </button>
        </div>
      </div>
    </div>
  );
};

interface DashboardLayoutProps {
  onLogout: () => void;
  onAuthClick: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout, onAuthClick }) => {
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  const [spaces, setSpaces] = useState<SlideSpace[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadSpaces = () => {
    if (isAuthenticated) {
      spaceApi.findAll().then(res => {
        if (res.statusCode === 0) {
          setSpaces(res.data.items);
        }
      });
    }
  };

  useEffect(() => {
    loadSpaces();
  }, [isAuthenticated]);

  const handleCreateSpace = async (name: string) => {
    try {
      const res = await spaceApi.create({ name, isPublic: false });
      if (res.statusCode === 0) {
        addToast('Space created successfully', 'success');
        loadSpaces();
      } else {
        addToast(res.message || 'Failed to create space', 'error');
      }
    } catch (err) {
      addToast('Failed to create space', 'error');
    }
  };

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
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-1 hover:bg-white/5 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-white/40" />
                </button>
              </div>
              <div className="space-y-1">
                {spaces.map(space => (
                  <Link
                    key={`sidebar-space-${space.id}`}
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

        {/* Create Space Modal */}
        <CreateSpaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateSpace}
        />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

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
