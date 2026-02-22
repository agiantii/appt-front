
import React, { useEffect, useState } from 'react';
import { Search, Globe, Palette, Box, BookOpen, Heart, Share2, MoreHorizontal } from 'lucide-react';
import { slideApi } from '../../api/slide';
import { themeApi, pluginApi } from '../../api/discovery';

const ExplorePage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'slide' | 'theme' | 'plugin'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let results: any[] = [];
        if (filter === 'all' || filter === 'slide') {
          const res = await slideApi.search({ pageSize: 12 });
          if (res.statusCode === 0) {
            results = [...results, ...res.data.items.map(i => ({ ...i, type: 'slide', author: 'Community' }))];
          }
        }
        if (filter === 'all' || filter === 'theme') {
          const res = await themeApi.findAll();
          if (res.statusCode === 0) {
            results = [...results, ...res.data.map(i => ({ ...i, title: i.packageName, type: 'theme', author: 'Official' }))];
          }
        }
        if (filter === 'all' || filter === 'plugin') {
          const res = await pluginApi.findAll();
          if (res.statusCode === 0) {
            results = [...results, ...res.data.map(i => ({ ...i, title: i.packageName, type: 'plugin', author: 'Official' }))];
          }
        }
        setItems(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter]);

  const categories = [
    { id: 'all', label: 'All Resources', icon: Globe },
    { id: 'slide', label: 'Slide Templates', icon: BookOpen },
    { id: 'theme', label: 'System Themes', icon: Palette },
    { id: 'plugin', label: 'Advanced Plugins', icon: Box },
  ];

  return (
    <div className="max-w-7xl mx-auto p-12 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
           <h1 className="text-5xl font-black tracking-tightest">Explore</h1>
           <p className="text-white/40 font-medium text-lg">Discover community creations and modular extensions.</p>
        </div>
        
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
          <input 
            type="text" 
            placeholder="Search the ecosystem..."
            className="w-full bg-[#18181b] border border-white/5 rounded-2xl py-3.5 pl-12 pr-6 text-sm focus:outline-none focus:ring-4 focus:ring-white/5 transition-all placeholder:text-white/20"
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
                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(item => (
          <div key={`${item.type}-${item.id}`} className="group bg-[#0c0c0e] border border-white/5 rounded-[32px] overflow-hidden hover:border-white/10 transition-all cursor-pointer flex flex-col hover:shadow-2xl hover:shadow-white/5">
            <div className="aspect-[16/11] bg-[#18181b] overflow-hidden relative">
              <img 
                src={item.previewUrl || `https://picsum.photos/seed/${item.id}/400/250`} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100"
              />
              <div className="absolute top-5 left-5">
                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] text-white/80">
                  {item.type}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                 <div className="flex gap-2">
                    <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white hover:text-black transition-colors">
                       <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white hover:text-black transition-colors">
                       <Share2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-white group-hover:text-white transition-colors truncate">{item.title}</h3>
                <MoreHorizontal className="w-5 h-5 text-white/10" />
              </div>
              <p className="text-sm text-white/40 font-medium">Design by <span className="text-white/60">{item.author}</span></p>
              <div className="mt-auto pt-6 flex items-center justify-between">
                 <div className="flex -space-x-2">
                   {[1,2,3].map(i => (
                     <img key={i} src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${item.id + i}`} className="w-6 h-6 rounded-full border-2 border-[#0c0c0e]" />
                   ))}
                 </div>
                 <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">1.2k Installs</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplorePage;
