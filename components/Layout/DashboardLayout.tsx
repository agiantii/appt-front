
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
import ThemeToggle from '../Common/ThemeToggle';

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
            toast.type === 'success' ? 'bg-green-600/90 text-white' : 'bg-destructive/90 text-white'
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
      <div className="relative w-[400px] bg-secondary border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Create New Space</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-accent/50 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Space Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Enter space name..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
    <div className="flex h-full w-full bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-secondary/50">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight text-foreground">Slidev.ai</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            (!item.authRequired || isAuthenticated) && (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-accent text-accent-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Spaces</span>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-1 hover:bg-accent/50 rounded transition-colors"
                >
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-1">
                {spaces.map(space => (
                  <Link
                    key={`sidebar-space-${space.id}`}
                    to={`/slide/${space.id}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
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

        <div className="p-4 border-t border-border">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              <Link to="/settings/info" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
              <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
