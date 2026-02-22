
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, FileText, Shield, Trash2, Save } from 'lucide-react';
import { spaceApi } from '../../api/space';
import { slideApi } from '../../api/slide';
import { SlideSpace, Slide } from '../../types';

const SpaceSettings: React.FC = () => {
  const { slideSpaceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [space, setSpace] = useState<SlideSpace | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', isPublic: false });

  useEffect(() => {
    if (slideSpaceId) {
      setLoading(true);
      Promise.all([
        spaceApi.findOne(Number(slideSpaceId)),
        slideApi.findAllBySpace(Number(slideSpaceId))
      ]).then(([spaceRes, slidesRes]) => {
        if (spaceRes.statusCode === 0) {
          setSpace(spaceRes.data);
          setFormData({
            name: spaceRes.data.name,
            isPublic: spaceRes.data.isPublic
          });
        }
        if (slidesRes.statusCode === 0) setSlides(slidesRes.data);
      }).finally(() => setLoading(false));
    }
  }, [slideSpaceId]);

  const handleSave = async () => {
    if (!slideSpaceId) return;
    try {
      const res = await spaceApi.update(Number(slideSpaceId), formData);
      if (res.statusCode === 0) {
        setSpace(res.data);
        alert('Settings saved successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSpace = async () => {
    if (!slideSpaceId || !window.confirm('Are you sure you want to delete this space? All slides will be lost.')) return;
    try {
      const res = await spaceApi.remove(Number(slideSpaceId));
      if (res.statusCode === 0) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-white/40">Loading settings...</div>;
  if (!space) return <div>Space not found</div>;

  const sidebarLinks = [
    { label: 'Basic Info', path: 'basic', icon: Globe },
    { label: 'Documents', path: 'docs', icon: FileText },
    { label: 'Permissions', path: 'access', icon: Shield },
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-white">
      {/* Settings Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0c0c0e] flex flex-col p-6">
        <Link to={`/slide/${slideSpaceId}`} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" /> Back to Space
        </Link>
        
        <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-6 px-3">Space Settings</h2>
        <nav className="space-y-1">
          {sidebarLinks.map(link => {
            const isActive = location.pathname.includes(`/settings/${link.path}`);
            return (
              <Link 
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-white/30'}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button 
            onClick={handleDeleteSpace}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400/60 hover:text-red-400 hover:bg-red-400/5 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Space
          </button>
        </div>
      </aside>

      {/* Settings Content */}
      <main className="flex-1 p-12 overflow-y-auto max-w-4xl">
        <Routes>
          <Route index element={<Navigate to="basic" replace />} />
          <Route path="basic" element={
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Basic Settings</h1>
                <p className="text-white/40">Update your space profile and visibility.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Space Name</label>
                  <input 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div>
                    <div className="text-sm font-medium">Public Visibility</div>
                    <div className="text-xs text-white/30">Allow anyone to view this space.</div>
                  </div>
                  <button 
                    onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.isPublic ? 'bg-white' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${formData.isPublic ? 'right-1 bg-black' : 'left-1 bg-white/40'}`} />
                  </button>
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-xl font-bold hover:bg-white/90 transition-all"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          } />
          <Route path="docs" element={
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Document Management</h1>
                  <p className="text-white/40">A table view of all documents in this space.</p>
                </div>
                
                <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/5">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Title</th>
                        <th className="px-6 py-4 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Status</th>
                        <th className="px-6 py-4 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Comments</th>
                        <th className="px-6 py-4 font-semibold text-white/40 uppercase tracking-widest text-[10px]">Updated</th>
                        <th className="px-6 py-4 font-semibold text-white/40 uppercase tracking-widest text-[10px]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {slides.map(slide => (
                        <tr key={slide.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4 font-medium">{slide.title}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${slide.isPublic ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                              {slide.isPublic ? 'Public' : 'Private'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-white/40">{slide.allowComment ? 'Enabled' : 'Disabled'}</td>
                          <td className="px-6 py-4 text-white/40">{new Date(slide.updatedAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                             <button className="p-1 hover:bg-white/10 rounded transition-all opacity-0 group-hover:opacity-100">
                               <MoreHorizontal className="w-4 h-4 text-white/30" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             </div>
          } />
        </Routes>
      </main>
    </div>
  );
};

const MoreHorizontal = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
);

export default SpaceSettings;
