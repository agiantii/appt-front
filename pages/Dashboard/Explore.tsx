
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Palette, Box, BookOpen, Heart, Share2, MoreHorizontal, CheckCircle, AlertCircle } from 'lucide-react';
import { slideApi } from '../../api/slide';
import { themeApi, pluginApi } from '../../api/discovery';

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
            toast.type === 'success' ? 'bg-success/90 text-white' : 'bg-destructive/90 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'slide' | 'theme' | 'plugin'>('slide');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let results: any[] = [];
        if (filter === 'slide') {
          const res = await slideApi.search({ keyword: searchKeyword || undefined, pageSize: 12 });
          if (res.statusCode === 0) {
            results = res.data.items.map(i => ({ ...i, type: 'slide', author: 'Community' }));
          }
        }
        if (filter === 'theme') {
          const res = await themeApi.findAll();
          if (res.statusCode === 0) {
            const themes = res.data.map(i => ({ ...i, title: i.packageName, type: 'theme', author: 'Official' }));
            results = searchKeyword 
              ? themes.filter(t => t.title.toLowerCase().includes(searchKeyword.toLowerCase()))
              : themes;
          }
        }
        if (filter === 'plugin') {
          const res = await pluginApi.findAll();
          if (res.statusCode === 0) {
            const plugins = res.data.map(i => ({ ...i, title: i.packageName, type: 'plugin', author: 'Official' }));
            results = searchKeyword 
              ? plugins.filter(p => p.title.toLowerCase().includes(searchKeyword.toLowerCase()))
              : plugins;
          }
        }
        setItems(results);
      } catch (err) {
        addToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, searchKeyword]);

  const categories = [
    { id: 'slide', label: 'Slide', icon: BookOpen },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'plugin', label: 'Plugins', icon: Box },
  ];

  return (
    <div className="max-w-7xl mx-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <h1 className="text-5xl font-black tracking-tightest">Explore</h1>
           <p className="text-muted-foreground font-medium text-lg">Discover community creations and modular extensions.</p>
        </div>
        
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search the ecosystem..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-ring/30 transition-all placeholder:text-muted-foreground"
          />
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              filter === cat.id 
                ? 'bg-primary text-primary-foreground shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                : 'bg-accent text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(item => (
          <div 
            key={`${item.type}-${item.id}`} 
            onClick={() => item.type === 'slide' && navigate(`/slide/presentation/${item.id}`)}
            className={`group bg-card border border-border rounded-[32px] overflow-hidden hover:border-border transition-all flex flex-col hover:shadow-2xl hover:shadow-white/5 ${item.type === 'slide' ? 'cursor-pointer' : ''}`}
          >
            <div className="aspect-[16/11] bg-card overflow-hidden relative">
              <img 
                src={item.previewUrl || `https://picsum.photos/seed/${item.id}/400/250`} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100"
              />
              <div className="absolute top-5 left-5">
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-border rounded-xl text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">
                  {item.type}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                 <div className="flex gap-2">
                    <button className="p-2.5 bg-accent backdrop-blur-md rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                       <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-accent backdrop-blur-md rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors">
                       <Share2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-foreground group-hover:text-foreground transition-colors truncate">{item.title}</h3>
                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-medium">Design by <span className="text-muted-foreground">{item.author}</span></p>
              {/* <div className="mt-auto pt-6 flex items-center justify-between">
                 <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <img key={i} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.id + i}`} className="w-6 h-6 rounded-full border-2 border-[#0c0c0e]" />
                   ))}
                 </div>
              </div> */}
            </div>
          </div>
        ))}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ExplorePage;
