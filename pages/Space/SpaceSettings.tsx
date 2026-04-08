
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Shield, Trash2, Save, X, CheckCircle, AlertCircle, MoreHorizontal } from 'lucide-react';
import { spaceApi } from '../../api/space';
import { slideApi } from '../../api/slide';
import { SlideSpace, Slide } from '../../types';

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
            toast.type === 'success' ? 'bg-success/90 text-foreground' : 'bg-destructive/90 text-foreground'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

// 确认删除弹窗组件
interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[400px] bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground/90">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-foreground/70 leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium bg-destructive text-foreground hover:bg-destructive/90 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// 基础设置页面组件
interface BasicSettingsProps {
  slideSpaceId: string;
  space: SlideSpace;
  onSpaceUpdate: (space: SlideSpace) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

const BasicSettings: React.FC<BasicSettingsProps> = ({ slideSpaceId, space, onSpaceUpdate, addToast }) => {
  const [formData, setFormData] = useState({ name: space.name, isPublic: space.isPublic });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await spaceApi.update(Number(slideSpaceId), formData);
      if (res.statusCode === 0) {
        onSpaceUpdate(res.data);
        addToast('Settings saved successfully', 'success');
      } else {
        addToast(res.message || 'Failed to save settings', 'error');
      }
    } catch (err) {
      addToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Basic Settings</h1>
        <p className="text-muted-foreground">Update your space profile and visibility.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Space Name</label>
          <input 
            className="w-full bg-accent border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between p-4 bg-accent border border-border rounded-xl">
          <div>
            <div className="text-sm font-medium">Public Visibility</div>
            <div className="text-xs text-muted-foreground/50">Allow anyone to view this space.</div>
          </div>
          <button 
            onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
            className={`w-12 h-6 rounded-full transition-all relative ${formData.isPublic ? 'bg-white' : 'bg-accent'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${formData.isPublic ? 'right-1 bg-black' : 'left-1 bg-white/40'}`} />
          </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-white/90 transition-all disabled:opacity-50"
      >
        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
};

// Slide 编辑弹窗组件
interface SlideEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slide: Slide | null;
  onSave: (slideId: number, data: { title?: string; isPublic?: boolean; allowComment?: boolean }) => void;
}

const SlideEditModal: React.FC<SlideEditModalProps> = ({ isOpen, onClose, slide, onSave }) => {
  const [formData, setFormData] = useState({ title: '', isPublic: false, allowComment: false });

  useEffect(() => {
    if (slide) {
      setFormData({
        title: slide.title,
        isPublic: slide.isPublic,
        allowComment: slide.allowComment
      });
    }
  }, [slide, isOpen]);

  const handleSave = () => {
    if (slide && formData.title.trim()) {
      onSave(slide.id, {
        title: formData.title.trim(),
        isPublic: formData.isPublic,
        allowComment: formData.allowComment
      });
      onClose();
    }
  };

  if (!isOpen || !slide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[400px] bg-card border border-border rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground/90">Edit Document</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/50 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              className="w-full bg-[#0c0c0e] border border-border rounded-lg px-3 py-2.5 text-sm text-foreground/90 focus:outline-none focus:border-white/30"
              autoFocus
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-accent border border-border rounded-lg">
            <span className="text-sm">Public</span>
            <button
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              className={`w-10 h-5 rounded-full transition-all relative ${formData.isPublic ? 'bg-white' : 'bg-accent'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${formData.isPublic ? 'right-0.5 bg-black' : 'left-0.5 bg-white/40'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-accent border border-border rounded-lg">
            <span className="text-sm">Allow Comments</span>
            <button
              onClick={() => setFormData({ ...formData, allowComment: !formData.allowComment })}
              className={`w-10 h-5 rounded-full transition-all relative ${formData.allowComment ? 'bg-white' : 'bg-accent'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${formData.allowComment ? 'right-0.5 bg-black' : 'left-0.5 bg-white/40'}`} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-foreground/60 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.title.trim()}
            className="px-4 py-2 text-xs font-medium bg-white text-black hover:bg-white/90 rounded-lg transition-colors disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// 文档管理页面组件
interface DocumentManagementProps {
  slideSpaceId: string;
  slides: Slide[];
  onSlidesUpdate: (slides: Slide[]) => void;
  addToast: (message: string, type: 'success' | 'error') => void;
}

const DocumentManagement: React.FC<DocumentManagementProps> = ({ slideSpaceId, slides, onSlidesUpdate, addToast }) => {
  const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditClick = (slide: Slide) => {
    setEditingSlide(slide);
    setIsEditModalOpen(true);
  };

  const handleSaveSlide = async (slideId: number, data: { title?: string; isPublic?: boolean; allowComment?: boolean }) => {
    try {
      const res = await slideApi.update(slideId, data);
      if (res.statusCode === 0) {
        const updatedSlides = slides.map(s => s.id === slideId ? res.data : s);
        onSlidesUpdate(updatedSlides);
        addToast('Document updated successfully', 'success');
      } else {
        addToast(res.message || 'Failed to update document', 'error');
      }
    } catch (err) {
      addToast('Failed to update document', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Document Management</h1>
        <p className="text-muted-foreground">Manage and update documents in this space.</p>
      </div>
      
      <div className="border border-border rounded-2xl overflow-hidden bg-accent">
        <table className="w-full text-left text-sm">
          <thead className="bg-accent border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Title</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Comments</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Updated</th>
              <th className="px-6 py-4 font-semibold text-muted-foreground uppercase tracking-widest text-[10px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {slides.map(slide => (
              <tr key={slide.id} className="hover:bg-accent transition-colors group">
                <td className="px-6 py-4 font-medium">{slide.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${slide.isPublic ? 'bg-success/20 text-success' : 'bg-accent text-muted-foreground'}`}>
                    {slide.isPublic ? 'Public' : 'Private'}
                  </span>
                </td>
                <td className="px-6 py-4 text-muted-foreground">{slide.allowComment ? 'Enabled' : 'Disabled'}</td>
                <td className="px-6 py-4 text-muted-foreground">{new Date(slide.updatedAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleEditClick(slide)}
                    className="p-1 hover:bg-accent rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground/50" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SlideEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        slide={editingSlide}
        onSave={handleSaveSlide}
      />
    </div>
  );
};

// 设置侧边栏组件
interface SettingsSidebarProps {
  slideSpaceId: string;
  onDeleteClick: () => void;
}

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ slideSpaceId, onDeleteClick }) => {
  const location = useLocation();

  const sidebarLinks = [
    { label: 'Basic Info', path: 'basic', icon: Globe },
    { label: 'Documents', path: 'docs', icon: FileText },
    { label: 'Permissions', path: 'access', icon: Shield },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col p-6">
      <Link to={`/slide/${slideSpaceId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" /> Back to Space
      </Link>
      
      <h2 className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-6 px-3">Space Settings</h2>
      <nav className="space-y-1">
        {sidebarLinks.map(link => {
          const fullPath = `/slide/${slideSpaceId}/settings/${link.path}`;
          const isActive = location.pathname === fullPath || location.pathname.includes(`${fullPath}/`);
          return (
            <Link 
              key={link.path}
              to={fullPath}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-foreground/50 hover:text-foreground hover:bg-accent'
              }`}
            >
              <link.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-muted-foreground/50'}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <button 
          onClick={onDeleteClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <Trash2 className="w-4 h-4" /> Delete Space
        </button>
      </div>
    </aside>
  );
};

// 主组件
const SpaceSettings: React.FC = () => {
  const { slideSpaceId } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState<SlideSpace | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadData = async () => {
    if (!slideSpaceId) return;
    setLoading(true);
    try {
      const [spaceRes, slidesRes] = await Promise.all([
        spaceApi.findOne(Number(slideSpaceId)),
        slideApi.findAllBySpace(Number(slideSpaceId))
      ]);
      if (spaceRes.statusCode === 0) setSpace(spaceRes.data);
      if (slidesRes.statusCode === 0) setSlides(slidesRes.data);
    } catch (err) {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slideSpaceId]);

  const handleSpaceUpdate = (updatedSpace: SlideSpace) => {
    setSpace(updatedSpace);
  };

  const handleSlidesUpdate = (updatedSlides: Slide[]) => {
    setSlides(updatedSlides);
  };

  const handleDeleteSpace = async () => {
    if (!slideSpaceId) return;
    try {
      const res = await spaceApi.remove(Number(slideSpaceId));
      if (res.statusCode === 0) {
        navigate('/dashboard');
      } else {
        addToast(res.message || 'Failed to delete space', 'error');
      }
    } catch (err) {
      addToast('Failed to delete space', 'error');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground">Loading settings...</div>;
  if (!space) return <div>Space not found</div>;

  return (
    <div className="flex h-screen bg-background text-foreground">
      <SettingsSidebar slideSpaceId={slideSpaceId!} onDeleteClick={() => setIsDeleteModalOpen(true)} />

      <main className="flex-1 p-12 overflow-y-auto max-w-4xl">
        <Routes>
          <Route index element={<Navigate to="basic" replace />} />
          <Route path="basic" element={
            <BasicSettings
              slideSpaceId={slideSpaceId!}
              space={space}
              onSpaceUpdate={handleSpaceUpdate}
              addToast={addToast}
            />
          } />
          <Route path="docs" element={
            <DocumentManagement
              slideSpaceId={slideSpaceId!}
              slides={slides}
              onSlidesUpdate={handleSlidesUpdate}
              addToast={addToast}
            />
          } />
        </Routes>
      </main>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteSpace}
        title="Delete Space"
        message="Are you sure you want to delete this space? All slides will be lost."
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default SpaceSettings;
