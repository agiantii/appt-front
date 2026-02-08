
import React, { useState } from 'react';
import { Search, Globe, Palette, Box, BookOpen } from 'lucide-react';
import { exploreItems } from '../../data/mock';

const ExplorePage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'slide' | 'theme' | 'plugin'>('all');

  const categories = [
    { id: 'all', label: 'All', icon: Globe },
    { id: 'slide', label: 'Slides', icon: BookOpen },
    { id: 'theme', label: 'Themes', icon: Palette },
    { id: 'plugin', label: 'Plugins', icon: Box },
  ];

  const filteredItems = filter === 'all' 
    ? exploreItems 
    : exploreItems.filter(item => item.type === filter);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search templates, themes, plugins..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/10 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === cat.id 
                ? 'bg-white text-black' 
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <div key={item.id} className="group bg-[#18181b] border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all cursor-pointer">
            <div className="aspect-[16/10] bg-white/5 overflow-hidden relative">
              <img 
                src={item.preview} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-md text-[10px] uppercase font-bold tracking-widest text-white/80">
                  {item.type}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white group-hover:text-white/90 transition-colors truncate">{item.title}</h3>
              <p className="text-sm text-white/40">by {item.author}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplorePage;
