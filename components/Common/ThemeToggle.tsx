import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 hover:bg-muted border border-border transition-all duration-200 group"
      aria-label="Toggle theme"
    >
      {/* 背景光晕效果 */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-primary/5 transition-all duration-200" />
      
      {/* 图标容器 */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* 暗色主题图标 - 太阳 */}
        <Sun 
          className={`w-5 h-5 text-foreground/70 group-hover:text-foreground transition-all duration-300 absolute ${
            theme === 'dark' 
              ? 'opacity-0 rotate-90 scale-75' 
              : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
        
        {/* 亮色主题图标 - 月亮 */}
        <Moon 
          className={`w-5 h-5 text-foreground/70 group-hover:text-foreground transition-all duration-300 absolute ${
            theme === 'light' 
              ? 'opacity-0 -rotate-90 scale-75' 
              : 'opacity-100 rotate-0 scale-100'
          }`} 
        />
      </div>
    </button>
  );
};

export default ThemeToggle;
