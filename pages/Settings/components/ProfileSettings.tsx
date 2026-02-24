import React, { useState, useEffect, useRef } from 'react';
import { User, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { userApi } from '../../../api/user';
import { uploadApi } from '../../../api/upload';
import { User as UserType } from '../../../types';

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

const ProfileSettings: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    avatarUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    userApi.getCurrentUser().then(res => {
      if (res.statusCode === 0) {
        setUser(res.data);
        setFormData({
          username: res.data.username,
          email: res.data.email,
          avatarUrl: res.data.avatarUrl || ''
        });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await userApi.updateCurrentUser(formData);
      if (res.statusCode === 0) {
        setUser(res.data);
        addToast('Profile updated successfully', 'success');
      } else {
        addToast(res.message || 'Update failed', 'error');
      }
    } catch (err) {
      addToast('Network error, please try again', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const uploadRes = await uploadApi.uploadImage(file);
      if (uploadRes.statusCode === 0) {
        const newAvatarUrl = uploadRes.data.url;
        const updateRes = await userApi.updateCurrentUser({
          ...formData,
          avatarUrl: newAvatarUrl
        });
        if (updateRes.statusCode === 0) {
          setUser(updateRes.data);
          setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
          addToast('Avatar updated successfully', 'success');
        } else {
          addToast(updateRes.message || 'Failed to update avatar', 'error');
        }
      } else {
        addToast(uploadRes.message || 'Upload failed', 'error');
      }
    } catch (err) {
      addToast('Network error, please try again', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Profile Info</h1>
        <p className="text-white/40">Manage your account details and public appearance.</p>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {user && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6 p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="relative">
              <img 
                src={formData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                className="w-24 h-24 rounded-2xl object-cover"
                alt="Avatar"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{user.username}</h3>
              <p className="text-white/40 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="p-8 bg-[#0c0c0e] border border-white/10 rounded-3xl space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="Enter your username"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
                placeholder="Enter your email"
              />
            </div>



            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <User className="w-4 h-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileSettings;
